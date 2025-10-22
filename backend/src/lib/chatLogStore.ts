import { promises as fs } from 'fs'
import path from 'path'

export type ChatLogStatus = 'success' | 'failure'

export interface ChatLogEntry {
  timestamp: string
  messageCount: number
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  status: ChatLogStatus
  errorMessage?: string
}

const LOG_DIRECTORY = path.resolve(__dirname, '../../data')
const LOG_FILE_PATH = path.join(LOG_DIRECTORY, 'chat-logs.json')

async function readLogFile(): Promise<ChatLogEntry[]> {
  try {
    const fileContents = await fs.readFile(LOG_FILE_PATH, 'utf-8')
    const parsed = JSON.parse(fileContents)

    if (Array.isArray(parsed)) {
      return parsed as ChatLogEntry[]
    }

    return []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

export async function appendChatLog(entry: ChatLogEntry): Promise<void> {
  const existingLogs = await readLogFile()
  existingLogs.push(entry)

  await fs.mkdir(LOG_DIRECTORY, { recursive: true })
  await fs.writeFile(LOG_FILE_PATH, JSON.stringify(existingLogs, null, 2), 'utf-8')
}

export async function getChatLogs(limit?: number): Promise<ChatLogEntry[]> {
  const logs = await readLogFile()

  if (typeof limit === 'number' && limit >= 0) {
    return logs.slice(-limit)
  }

  return logs
}
