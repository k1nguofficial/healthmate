type ChatInteraction = {
  timestamp: number
  userMessages: number
  promptTokens: number | null
  completionTokens: number | null
  responseTimeMs: number
}

const metrics = {
  totalRequests: 0,
  totalUserMessages: 0,
  totalAssistantReplies: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalResponseTimeMs: 0,
  lastInteractionAt: null as number | null,
}

const RECENT_LIMIT = 25
const recentInteractions: ChatInteraction[] = []

export type ChatMetricsPayload = {
  userMessages: number
  promptTokens?: number | null
  completionTokens?: number | null
  responseTimeMs: number
}

export function recordChatMetrics({
  userMessages,
  promptTokens,
  completionTokens,
  responseTimeMs,
}: ChatMetricsPayload) {
  metrics.totalRequests += 1
  metrics.totalUserMessages += userMessages
  metrics.totalAssistantReplies += 1
  metrics.totalPromptTokens += promptTokens ?? 0
  metrics.totalCompletionTokens += completionTokens ?? 0
  metrics.totalResponseTimeMs += responseTimeMs
  metrics.lastInteractionAt = Date.now()

  recentInteractions.unshift({
    timestamp: metrics.lastInteractionAt,
    userMessages,
    promptTokens: promptTokens ?? null,
    completionTokens: completionTokens ?? null,
    responseTimeMs,
  })

  if (recentInteractions.length > RECENT_LIMIT) {
    recentInteractions.length = RECENT_LIMIT
  }
}

export function getAnalyticsSummary() {
  const { totalRequests } = metrics

  const average = (total: number) => (totalRequests > 0 ? total / totalRequests : 0)

  return {
    totals: {
      requests: metrics.totalRequests,
      userMessages: metrics.totalUserMessages,
      assistantReplies: metrics.totalAssistantReplies,
      promptTokens: metrics.totalPromptTokens,
      completionTokens: metrics.totalCompletionTokens,
    },
    averages: {
      promptTokens: average(metrics.totalPromptTokens),
      completionTokens: average(metrics.totalCompletionTokens),
      responseTimeMs: average(metrics.totalResponseTimeMs),
    },
    lastInteractionAt: metrics.lastInteractionAt ? new Date(metrics.lastInteractionAt).toISOString() : null,
    recent: recentInteractions.map((interaction) => ({
      timestamp: new Date(interaction.timestamp).toISOString(),
      userMessages: interaction.userMessages,
      promptTokens: interaction.promptTokens,
      completionTokens: interaction.completionTokens,
      responseTimeMs: interaction.responseTimeMs,
    })),
  }
}
