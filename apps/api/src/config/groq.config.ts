import { registerAs } from '@nestjs/config';

export interface GroqConfig {
  apiKey: string;
  model: string;
}

export default registerAs('groq', (): GroqConfig => ({
  apiKey: process.env.GROQ_API_KEY ?? '',
  model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
}));
