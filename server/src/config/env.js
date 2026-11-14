import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().default('rakshachain'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173,https://localhost,capacitor://localhost'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:4000'),
  DEMO_MODE: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  DEFAULT_ESCALATION_SPEED: z.enum(['SPEC', 'FAST', 'NORMAL']).default('FAST'),
  ACK_STOPS_LADDER: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  SEED_DEMO: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  NOTIFIER_DRIVER: z.enum(['mock', 'fcm', 'twilio']).default('mock'),
  FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),
  TWILIO_SID: z.string().optional(),
  TWILIO_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  TRIAGE_LLM_KEY: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment configuration error:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production') {
  const secret = parsed.data.JWT_SECRET;
  if (secret.length < 32 || /placeholder|change.?me|default|example|secret123/i.test(secret)) {
    console.error('Environment configuration error: production JWT_SECRET must be at least 32 characters and must not be a default or placeholder.');
    process.exit(1);
  }
}

export const env = parsed.data;
