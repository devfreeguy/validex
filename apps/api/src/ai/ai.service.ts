import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Recommendation } from '@/analysis/report.types';

export interface AIVerdictPayload {
  domain: string;
  overallScore: number | null;
  grade: string;
  /** Deterministic, computed by the caller - the AI writes prose around
   * this, it never invents or contradicts it. */
  recommendation: Recommendation;
  categories: Record<string, { score: number | null; confidence: number }>;
  strengths: string[];
  weaknesses: string[];
  confidence: number;
}

export interface AIVerdict {
  executiveSummary: string | null;
  riskFlags: string[] | null;
  categoryNarrative: Record<string, string> | null;
}

const NULL_VERDICT: AIVerdict = {
  executiveSummary: null,
  riskFlags: null,
  categoryNarrative: null,
};

const GROQ_CHAT_COMPLETIONS_URL =
  'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 15_000;
const SYSTEM_PROMPT =
  'You are a technical analyst. Given a startup validation report and a ' +
  'pre-computed recommendation, respond with ONLY a single JSON object ' +
  '(no prose, no markdown fences) with exactly these keys: ' +
  '"executiveSummary" (a concise 3-5 sentence factual executive summary), ' +
  '"riskFlags" (an array of 1-5 short strings naming the most important ' +
  'risks, or an empty array if none), "categoryNarrative" (an object ' +
  'mapping each category name given in the input to a 1-2 sentence ' +
  'factual narrative about that category). Be factual and direct. Do not ' +
  'invent information not present in the data. Do not speculate about ' +
  'future performance. Describe only what the observable signals ' +
  'indicate. The "recommendation" field in the input is fixed and already ' +
  'decided - never contradict it, restate it as your own, or propose a ' +
  'different one; write around it.';

interface GroqChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface ParsedVerdictJson {
  executiveSummary?: unknown;
  riskFlags?: unknown;
  categoryNarrative?: unknown;
}

function stripCodeFence(content: string): string {
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(content.trim());
  return fenced ? fenced[1] : content;
}

function parseVerdict(content: string): AIVerdict | null {
  try {
    const parsed = JSON.parse(stripCodeFence(content)) as ParsedVerdictJson;

    const executiveSummary =
      typeof parsed.executiveSummary === 'string' &&
      parsed.executiveSummary.trim().length > 0
        ? parsed.executiveSummary.trim()
        : null;

    const riskFlags =
      Array.isArray(parsed.riskFlags) &&
      parsed.riskFlags.every((flag) => typeof flag === 'string')
        ? (parsed.riskFlags as string[])
        : null;

    const categoryNarrative =
      parsed.categoryNarrative &&
      typeof parsed.categoryNarrative === 'object' &&
      !Array.isArray(parsed.categoryNarrative)
        ? Object.fromEntries(
            Object.entries(parsed.categoryNarrative as Record<string, unknown>)
              .filter(([, v]) => typeof v === 'string')
              .map(([k, v]) => [k, v as string]),
          )
        : null;

    if (!executiveSummary && !riskFlags && !categoryNarrative) return null;
    return { executiveSummary, riskFlags, categoryNarrative };
  } catch {
    return null;
  }
}

/** Never throws - Groq being unavailable must never fail the main response. */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateVerdict(payload: AIVerdictPayload): Promise<AIVerdict> {
    const apiKey = this.configService.get<string>('groq.apiKey');
    const model = this.configService.get<string>('groq.model');
    if (!apiKey) return NULL_VERDICT;

    try {
      const response = await axios.post<GroqChatCompletionResponse>(
        GROQ_CHAT_COMPLETIONS_URL,
        {
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(payload) },
          ],
        },
        {
          timeout: REQUEST_TIMEOUT_MS,
          validateStatus: () => true,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status < 200 || response.status >= 300) {
        this.logger.warn(`Groq API returned HTTP ${response.status}.`);
        return NULL_VERDICT;
      }

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) return NULL_VERDICT;

      return parseVerdict(content) ?? NULL_VERDICT;
    } catch (err) {
      this.logger.warn(`Groq verdict generation failed: ${String(err)}`);
      return NULL_VERDICT;
    }
  }
}
