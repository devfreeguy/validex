import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AISummaryPayload {
  domain: string;
  overallScore: number | null;
  grade: string;
  categories: Record<string, { score: number | null; confidence: number }>;
  strengths: string[];
  weaknesses: string[];
  confidence: number;
}

const GROQ_CHAT_COMPLETIONS_URL =
  'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 15_000;
const SYSTEM_PROMPT =
  'You are a technical analyst. Given a startup validation report, write a ' +
  'concise 3-5 sentence executive summary. Be factual and direct. Do not ' +
  'invent information not present in the data. Do not speculate about ' +
  'future performance. Describe only what the observable signals indicate.';

interface GroqChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/** Never throws - Groq being unavailable must never fail the main response. */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateSummary(payload: AISummaryPayload): Promise<string | null> {
    const apiKey = this.configService.get<string>('groq.apiKey');
    const model = this.configService.get<string>('groq.model');
    if (!apiKey) return null;

    try {
      const response = await axios.post<GroqChatCompletionResponse>(
        GROQ_CHAT_COMPLETIONS_URL,
        {
          model,
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
        return null;
      }

      const content = response.data.choices?.[0]?.message?.content;
      const trimmed = content?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : null;
    } catch (err) {
      this.logger.warn(`Groq summary generation failed: ${String(err)}`);
      return null;
    }
  }
}
