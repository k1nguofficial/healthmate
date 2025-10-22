import cors, { type CorsOptions } from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import Groq from 'groq-sdk'
import chatRouter from './routes/chat'
import analyticsRouter from './routes/analytics'
import { env } from './env'

const app = express()

const corsOptions: CorsOptions = {
  origin: env.NODE_ENV === 'production' ? env.FRONTEND_ORIGIN : true,
}

app.use(cors(corsOptions))

app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV })
})

app.use('/api/chat', chatRouter)
app.use('/api/analytics', analyticsRouter)

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof Groq.APIError) {
    return res.status(error.status ?? 500).json({
      error: error.message,
      type: error.name,
    })
  }

  console.error('Unexpected error:', error)

  return res.status(500).json({
    error: 'Internal server error',
  })
})

const server = app.listen(env.PORT, () => {
  console.log(`🚀 HealthMate backend running on http://localhost:${env.PORT}`)
})

server.on('error', (error) => {
  console.error('Failed to start server:', error)
})
