import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export type ChatState = {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  input: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050'

const initialMessages: ChatMessage[] = [
  {
    id: 'intro',
    role: 'assistant',
    content:
      "Hi, I'm HealthMate. Describe your symptoms or health concern and I'll share general guidance. I'm not a doctor, so always consult a healthcare professional for diagnosis or emergencies.",
  },
]

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10)

export function useChatSession() {
  const [state, setState] = useState<ChatState>({
    messages: initialMessages,
    isLoading: false,
    error: null,
    input: '',
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const trimmedInput = state.input.trim()

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }))
  }, [])

  const resetChat = useCallback(() => {
    abortControllerRef.current?.abort()
    setState({
      messages: initialMessages,
      isLoading: false,
      error: null,
      input: '',
    })
  }, [])

  const sendMessage = useCallback(async () => {
    if (!trimmedInput) return

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmedInput,
    }

    const conversationForRequest = [...state.messages, userMessage]

    setState((prev) => ({
      ...prev,
      messages: conversationForRequest,
      input: '',
      isLoading: true,
      error: null,
    }))

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationForRequest.slice(-10).map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error ?? 'Unable to fetch a response right now. Please try again later.'
        throw new Error(typeof message === 'string' ? message : 'Unexpected error contacting HealthMate.')
      }

      const data = (await response.json()) as { reply?: string }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content:
          data.reply ??
          "I'm sorry, I wasn't able to process that response. Please try asking your question another way.",
      }

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }))
    } catch (caughtError) {
      if ((caughtError as Error).name === 'AbortError') {
        return
      }

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Something went wrong while contacting the AI assistant.'

      setState((prev) => ({
        ...prev,
        error: message,
        messages: [
          ...prev.messages,
          {
            id: createId(),
            role: 'assistant',
            content:
              'I ran into a problem while generating a response. Please check your connection and try again shortly.',
          },
        ],
      }))
    } finally {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    }
  }, [state.messages, trimmedInput])

  const conversationSummary = useMemo(
    () => state.messages.map((message) => `${message.role}: ${message.content}`).join('\n'),
    [state.messages],
  )

  return {
    state,
    trimmedInput,
    setInput,
    sendMessage,
    resetChat,
    conversationSummary,
  }
}
