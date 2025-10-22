import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { groqClient } from '../lib/groq'
import { env } from '../env'

const chatRouter = Router()

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z
    .string()
    .min(1, 'Message content must include at least one character.')
    .max(2000, 'Message is too long. Try summarizing your question.'),
})

const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, 'Please include at least one message in the conversation.'),
})

const systemPrompt = `You are HealthMate, an AI health companion that offers general guidance only.
- Always include a brief safety disclaimer that you are not a doctor.
- Encourage consulting licensed healthcare professionals for diagnosis and treatment.
- Structure your answers with concise sections:
  1. Summary of what you understood.
  2. Possible causes or factors (if relevant).
  3. Suggested next steps, self-care tips, and when to seek urgent care.
- Alert the user to seek emergency care immediately if you detect life-threatening symptoms (e.g., chest pain, difficulty breathing, severe bleeding, stroke symptoms).
- Keep the overall response under 180 words unless the user explicitly asks for more detail.
- Base each reply on the full conversation so far and acknowledge follow-up questions concisely.
- When the conversation begins (your first reply), open with exactly: "Hi, I'm HealthMate. Describe your symptoms or health concern and I'll share general guidance. I'm not a doctor, so always consult a healthcare professional for diagnosis or emergencies."
- If the user asks about topics unrelated to their health (e.g., math, puzzles, coding), firmly refuse to engage with that topic and reply verbatim with: "I'm happy to help with health-related questions, but HealthMate only provides general health guidance. Please share your symptoms or health concern so I can assist." Do not add additional information about solving the non-health request.
- Respect privacy: do not ask for identifying details beyond health-related context.`.trim()

chatRouter.post('/', async (req, res, next) => {
  const parseResult = chatRequestSchema.safeParse(req.body)

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request body.',
      details: parseResult.error.flatten(),
    })
  }

  const { messages } = parseResult.data

  try {
    const limitedMessages = messages.slice(-10)
    const completion = await groqClient.chat.completions.create({
      model: env.GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 768,
      messages: [
        { role: 'system', content: systemPrompt },
        ...limitedMessages,
      ],
    })

    const reply = completion.choices[0]?.message?.content?.trim()

    if (!reply) {
      return res.status(502).json({
        error: 'The assistant returned an empty response. Please try again.',
      })
    }

    return res.json({
      reply,
      model: completion.model,
      usage: completion.usage,
    })
  } catch (error) {
    return next(error)
  }
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
chatRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof Groq.APIError) {
    return res.status(error.status ?? 500).json({
      error: error.message,
      type: error.name,
    })
  }

  return next(error)
})

export default chatRouter
