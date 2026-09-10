import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiService, AIVerdictPayload } from './ai.service';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('AiService', () => {
  let service: AiService;
  let configService: jest.Mocked<ConfigService>;

  const mockPayload: AIVerdictPayload = {
    domain: 'stripe.com',
    overallScore: 92,
    grade: 'A',
    recommendation: 'integrate',
    categories: {
      security: { score: 95, confidence: 90 },
      trust: { score: 90, confidence: 95 },
    },
    strengths: ['Valid TLS certificate', 'SPF and DMARC enforced'],
    weaknesses: [],
    confidence: 92,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'groq.apiKey') return 'test-key';
        if (key === 'groq.model') return 'llama-3.3-70b-versatile';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AiService(configService);
  });

  it('returns NULL_VERDICT if no apiKey is configured', async () => {
    (configService.get as jest.Mock).mockReturnValue(undefined);

    const result = await service.generateVerdict(mockPayload);
    expect(result).toEqual({
      executiveSummary: null,
      insights: null,
      suggestions: null,
      opportunities: null,
      riskFlags: null,
      categoryNarrative: null,
    });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('parses valid AI verdict with insights, suggestions, opportunities, risk flags, and narratives', async () => {
    const aiResponse = {
      executiveSummary: 'Stripe demonstrates stellar technical posture.',
      insights: [
        'TLS and mail authentication configurations meet top-tier industry standards.',
        'High domain age and trust signals indicate robust operational maturity.',
      ],
      suggestions: [
        'Ensure CSP header directives are continually audited.',
        'Maintain automated monitoring for TLS certificate renewal.',
      ],
      opportunities: [
        'Integrate webhook signing validation directly into enterprise workflow.',
      ],
      riskFlags: ['Minor header omission'],
      categoryNarrative: {
        security: 'Strong cryptographic controls with minor header adjustments possible.',
        trust: 'Established operational track record with valid legal disclosures.',
      },
    };

    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        choices: [{ message: { content: JSON.stringify(aiResponse) } }],
      },
    });

    const result = await service.generateVerdict(mockPayload);
    expect(result).toEqual({
      executiveSummary: 'Stripe demonstrates stellar technical posture.',
      insights: [
        'TLS and mail authentication configurations meet top-tier industry standards.',
        'High domain age and trust signals indicate robust operational maturity.',
      ],
      suggestions: [
        'Ensure CSP header directives are continually audited.',
        'Maintain automated monitoring for TLS certificate renewal.',
      ],
      opportunities: [
        'Integrate webhook signing validation directly into enterprise workflow.',
      ],
      riskFlags: ['Minor header omission'],
      categoryNarrative: {
        security: 'Strong cryptographic controls with minor header adjustments possible.',
        trust: 'Established operational track record with valid legal disclosures.',
      },
    });
  });

  it('parses responses wrapped in markdown code fences', async () => {
    const aiResponse = {
      executiveSummary: 'Solid architecture.',
      insights: ['Clear separation of trust and security.'],
      suggestions: ['Add CAA record.'],
      opportunities: ['Expand open API documentation.'],
      riskFlags: [],
      categoryNarrative: { security: 'All good.' },
    };

    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        choices: [
          { message: { content: '```json\n' + JSON.stringify(aiResponse) + '\n```' } },
        ],
      },
    });

    const result = await service.generateVerdict(mockPayload);
    expect(result.executiveSummary).toBe('Solid architecture.');
    expect(result.insights).toEqual(['Clear separation of trust and security.']);
    expect(result.suggestions).toEqual(['Add CAA record.']);
    expect(result.opportunities).toEqual(['Expand open API documentation.']);
  });

  it('returns NULL_VERDICT gracefully on network failure without throwing', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network connection timeout'));

    const result = await service.generateVerdict(mockPayload);
    expect(result).toEqual({
      executiveSummary: null,
      insights: null,
      suggestions: null,
      opportunities: null,
      riskFlags: null,
      categoryNarrative: null,
    });
  });

  it('returns NULL_VERDICT if Groq returns non-200 status code', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: 500,
      data: {},
    });

    const result = await service.generateVerdict(mockPayload);
    expect(result).toEqual({
      executiveSummary: null,
      insights: null,
      suggestions: null,
      opportunities: null,
      riskFlags: null,
      categoryNarrative: null,
    });
  });
});
