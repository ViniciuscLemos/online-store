import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  // without DATABASE_URL the server uses PGlite (Postgres running inside Node),
  // so you can try the project without installing anything
  DATABASE_URL: z.string().optional(),
  // same server and login with another database: on Render the store borrows the connection of
  // another service on the same Neon project and only swaps the name, so no password is copied
  DATABASE_NAME: z.string().optional(),
  PGLITE_DIR: z.string().default('.pglite'),
  // on Render the site's address comes in RENDER_EXTERNAL_URL, so it doesn't need to be set by hand
  APP_URL: z
    .string()
    .url()
    .default(process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173'),
  // without SMTP_URL the emails stay in memory and show up in the store's demo inbox
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('Online Store <no-reply@example.com>'),
  // without the Stripe keys the store uses a demo checkout page
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  // adds the sample products on startup (used by the demo deploy)
  SEED_SAMPLE_PRODUCTS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  console.error('Invalid environment variables:', z.flattenError(result.error).fieldErrors);
  process.exit(1);
}

if (result.data.STRIPE_SECRET_KEY && !result.data.STRIPE_WEBHOOK_SECRET) {
  console.error('STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set.');
  process.exit(1);
}

function withDatabase(url: string | undefined, name: string | undefined) {
  if (!url || !name) return url;
  const parsed = new URL(url);
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

export const config = { ...result.data, DATABASE_URL: withDatabase(result.data.DATABASE_URL, result.data.DATABASE_NAME) };
export const isProduction = config.NODE_ENV === 'production';
