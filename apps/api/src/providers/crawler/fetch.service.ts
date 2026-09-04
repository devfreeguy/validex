import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface FetchResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string | null;
  finalUrl: string;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Lightweight HTTP fetch for the Quick tier (no browser). Never throws -
 * network failures resolve to null.
 */
@Injectable()
export class FetchService {
  async get(
    url: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<FetchResult | null> {
    try {
      const response = await axios.get<string>(url, {
        timeout: timeoutMs,
        maxRedirects: 5,
        responseType: 'text',
        transitional: { clarifyTimeoutError: true },
        validateStatus: () => true,
        headers: { 'User-Agent': 'ValidexBot/1.0 (+https://validex.dev)' },
      });

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (typeof value === 'string') headers[key] = value;
      }

      const finalUrl =
        (response.request?.res?.responseUrl as string | undefined) ?? url;

      return {
        statusCode: response.status,
        headers,
        body: typeof response.data === 'string' ? response.data : null,
        finalUrl,
      };
    } catch {
      return null;
    }
  }
}
