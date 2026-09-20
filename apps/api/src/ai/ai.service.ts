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
  insights: string[] | null;
  suggestions: string[] | null;
  opportunities: string[] | null;
  riskFlags: string[] | null;
  categoryNarrative: Record<string, string> | null;
}

const NULL_VERDICT: AIVerdict = {
  executiveSummary: null,
  insights: null,
  suggestions: null,
  opportunities: null,
  riskFlags: null,
  categoryNarrative: null,
};

export interface ComparisonVerdictPayload {
  /** Deterministic, computed by the caller from scores - the AI writes
   * around it, it never picks or contradicts the winner. */
  winnerDomain: string;
  targets: Array<{
    domain: string;
    overallScore: number | null;
    grade: string;
    categories: Record<string, { score: number | null; confidence: number }>;
    strengths: string[];
    weaknesses: string[];
  }>;
}

export interface ComparisonLesson {
  domain: string;
  recommendations: string[];
}

export interface ComparisonAIVerdict {
  executiveSummary: string | null;
  winningFactors: string[] | null;
  lessons: ComparisonLesson[] | null;
}

const NULL_COMPARISON_VERDICT: ComparisonAIVerdict = {
  executiveSummary: null,
  winningFactors: null,
  lessons: null,
};

const GROQ_CHAT_COMPLETIONS_URL =
  'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 15_000;
const SYSTEM_PROMPT =
  'You are a technical analyst. Given a startup validation report and a ' +
  'pre-computed recommendation, respond with ONLY a single JSON object ' +
  '(no prose, no markdown fences) with exactly these keys: ' +
  '"executiveSummary" (a concise 3-5 sentence factual executive summary), ' +
  '"insights" (an array of 2-5 concise analytical insights based on the evaluation signals), ' +
  '"suggestions" (an array of 2-5 actionable suggestions or recommendations to address weaknesses and improve validation posture), ' +
  '"opportunities" (an array of 1-4 strategic or engineering growth opportunities), ' +
  '"riskFlags" (an array of 1-5 short strings naming the most important risks, or an empty array if none), ' +
  '"categoryNarrative" (an object mapping each category name given in the input to a 1-2 sentence factual narrative about that category). ' +
  'Be factual and direct. Do not invent information not present in the data. Do not speculate about ' +
  'future performance. Describe only what the observable signals indicate. ' +
  'The "recommendation" field in the input is fixed and already decided - never contradict it, ' +
  'restate it as your own, or propose a different one; write around it.';

const COMPARISON_SYSTEM_PROMPT =
  'You are a technical analyst comparing multiple startups by their validation reports. ' +
  'The winner is already determined by score and given as "winnerDomain" - never contradict it, ' +
  'pick a different one, or include it as a lesson target. Respond with ONLY a single JSON object ' +
  '(no prose, no markdown fences) with exactly these keys: ' +
  '"executiveSummary" (a concise 3-5 sentence factual summary of how the targets compare and why the winner leads), ' +
  '"winningFactors" (an array of 2-5 concise factual reasons the winner scored higher, grounded only in its given strengths/category scores), ' +
  '"lessons" (an array with one object per NON-winning domain - never the winner - each shaped ' +
  '{"domain": <must exactly match one of the given non-winning domains>, "recommendations": <array of 2-4 concrete, ' +
  'actionable steps that domain could take to close the gap, each one grounded in an actual weakness of that domain ' +
  'and/or an actual strength of the winner>}). ' +
  'Be factual and direct. Do not invent information not present in the data. Do not speculate about future performance.';

interface GroqChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface ParsedVerdictJson {
  executiveSummary?: unknown;
  insights?: unknown;
  suggestions?: unknown;
  opportunities?: unknown;
  riskFlags?: unknown;
  categoryNarrative?: unknown;
}

function stripCodeFence(content: string): string {
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(content.trim());
  return fenced ? fenced[1] : content;
}

function parseStringArray(val: unknown): string[] | null {
  if (!Array.isArray(val)) return null;
  const filtered = val
    .filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    )
    .map((item) => item.trim());
  return filtered.length > 0 ? filtered : null;
}

function parseVerdict(content: string): AIVerdict | null {
  try {
    const parsed = JSON.parse(stripCodeFence(content)) as ParsedVerdictJson;

    const executiveSummary =
      typeof parsed.executiveSummary === 'string' &&
      parsed.executiveSummary.trim().length > 0
        ? parsed.executiveSummary.trim()
        : null;

    const insights = parseStringArray(parsed.insights);
    const suggestions = parseStringArray(parsed.suggestions);
    const opportunities = parseStringArray(parsed.opportunities);
    const riskFlags = parseStringArray(parsed.riskFlags);

    const categoryNarrative =
      parsed.categoryNarrative &&
      typeof parsed.categoryNarrative === 'object' &&
      !Array.isArray(parsed.categoryNarrative)
        ? Object.fromEntries(
            Object.entries(parsed.categoryNarrative as Record<string, unknown>)
              .filter(
                ([, v]) =>
                  typeof v === 'string' && (v as string).trim().length > 0,
              )
              .map(([k, v]) => [k, (v as string).trim()]),
          )
        : null;

    if (
      !executiveSummary &&
      !insights &&
      !suggestions &&
      !opportunities &&
      !riskFlags &&
      !categoryNarrative
    ) {
      return null;
    }

    return {
      executiveSummary,
      insights,
      suggestions,
      opportunities,
      riskFlags,
      categoryNarrative,
    };
  } catch {
    return null;
  }
}

interface ParsedComparisonVerdictJson {
  executiveSummary?: unknown;
  winningFactors?: unknown;
  lessons?: unknown;
}

function parseLessons(val: unknown): ComparisonLesson[] | null {
  if (!Array.isArray(val)) return null;
  const lessons = val
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null,
    )
    .map((item) => ({
      domain: typeof item.domain === 'string' ? item.domain.trim() : '',
      recommendations: parseStringArray(item.recommendations) ?? [],
    }))
    .filter(
      (lesson) => lesson.domain.length > 0 && lesson.recommendations.length > 0,
    );
  return lessons.length > 0 ? lessons : null;
}

function parseComparisonVerdict(content: string): ComparisonAIVerdict | null {
  try {
    const parsed = JSON.parse(
      stripCodeFence(content),
    ) as ParsedComparisonVerdictJson;

    const executiveSummary =
      typeof parsed.executiveSummary === 'string' &&
      parsed.executiveSummary.trim().length > 0
        ? parsed.executiveSummary.trim()
        : null;
    const winningFactors = parseStringArray(parsed.winningFactors);
    const lessons = parseLessons(parsed.lessons);

    if (!executiveSummary && !winningFactors && !lessons) return null;

    return { executiveSummary, winningFactors, lessons };
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

  async generateComparisonVerdict(
    payload: ComparisonVerdictPayload,
  ): Promise<ComparisonAIVerdict> {
    const apiKey = this.configService.get<string>('groq.apiKey');
    const model = this.configService.get<string>('groq.model');
    if (!apiKey) return NULL_COMPARISON_VERDICT;

    try {
      const response = await axios.post<GroqChatCompletionResponse>(
        GROQ_CHAT_COMPLETIONS_URL,
        {
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: COMPARISON_SYSTEM_PROMPT },
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
        return NULL_COMPARISON_VERDICT;
      }

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) return NULL_COMPARISON_VERDICT;

      return parseComparisonVerdict(content) ?? NULL_COMPARISON_VERDICT;
    } catch (err) {
      this.logger.warn(
        `Groq comparison verdict generation failed: ${String(err)}`,
      );
      return NULL_COMPARISON_VERDICT;
    }
  }
}
