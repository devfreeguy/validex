import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CacheService } from '@/cache/cache.service';

export interface OSVVuln {
  id: string;
  summary: string;
  severity: string | null;
}

export interface OSVResult {
  vulns: OSVVuln[];
  totalCount: number;
}

interface RawOSVVuln {
  id: string;
  summary?: string;
  details?: string;
  severity?: Array<{ type: string; score: string }>;
}

interface RawOSVResponse {
  vulns?: RawOSVVuln[];
}

const OSV_API_BASE = 'https://api.osv.dev/v1';
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_SECONDS = 24 * 60 * 60;

function mapVuln(raw: RawOSVVuln): OSVVuln {
  return {
    id: raw.id,
    summary: raw.summary ?? raw.details ?? '',
    severity: raw.severity?.[0]?.score ?? null,
  };
}

/** Never throws - network failures resolve to null. */
@Injectable()
export class OsvProvider {
  private readonly logger = new Logger(OsvProvider.name);

  constructor(private readonly cacheService: CacheService) {}

  async queryPackage(
    name: string,
    ecosystem: string,
    version?: string,
  ): Promise<OSVResult | null> {
    const cacheKey = `osv:${ecosystem}:${name}:${version ?? 'latest'}`;
    const cached = await this.cacheService.get<OSVResult>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    try {
      const body: Record<string, unknown> = {
        package: { name, ecosystem },
      };
      if (version) body.version = version;

      const response = await axios.post<RawOSVResponse>(
        `${OSV_API_BASE}/query`,
        body,
        { timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true },
      );

      if (response.status < 200 || response.status >= 300) return null;

      const vulns = (response.data.vulns ?? []).map(mapVuln);
      const result: OSVResult = { vulns, totalCount: vulns.length };

      // CacheService.set's ttl is milliseconds (cache-manager v5 convention).
      await this.cacheService.set(cacheKey, result, CACHE_TTL_SECONDS * 1000);
      return result;
    } catch (err) {
      this.logger.debug(
        `OSV query failed for ${ecosystem}/${name}: ${String(err)}`,
      );
      return null;
    }
  }
}
