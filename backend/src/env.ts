import { config } from 'dotenv'
import { z } from 'zod'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional(),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required to call the Groq API'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  GROQ_MODEL: z
    .string()
    .min(1)
    .default('llama-3.1-8b-instant'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors)
  process.exit(1)
}

const rawEnv = parsedEnv.data
const port = rawEnv.PORT ? Number(rawEnv.PORT) : 5050

if (Number.isNaN(port)) {
  console.error('❌ PORT must be a number when defined.')
  process.exit(1)
}

export const env = {
  NODE_ENV: rawEnv.NODE_ENV,
  PORT: port,
  GROQ_API_KEY: rawEnv.GROQ_API_KEY,
  FRONTEND_ORIGIN: rawEnv.FRONTEND_ORIGIN,
  GROQ_MODEL: rawEnv.GROQ_MODEL,
} as const
