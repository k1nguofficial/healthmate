import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { getAnalyticsSummary } from '../lib/analytics'

const analyticsRouter = Router()

const formatChartLabel = (isoTimestamp: string, index: number) => {
  const date = new Date(isoTimestamp)

  if (Number.isNaN(date.getTime())) {
    return `Chat ${index + 1}`
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const percentageChange = (latest: number, earliest: number): number | null => {
  if (!Number.isFinite(latest) || !Number.isFinite(earliest) || earliest === 0) {
    return null
  }

  return ((latest - earliest) / Math.abs(earliest)) * 100
}

const changeDirection = (change: number | null): 'up' | 'down' | 'flat' => {
  if (change === null) {
    return 'flat'
  }

  if (Math.abs(change) < 0.0001) {
    return 'flat'
  }

  return change > 0 ? 'up' : 'down'
}

analyticsRouter.get('/summary', (_req, res) => {
  const summary = getAnalyticsSummary()

  const totals = [
    {
      id: 'total-requests',
      label: 'Total Chats',
      value: summary.totals.requests,
    },
    {
      id: 'total-user-messages',
      label: 'User Messages',
      value: summary.totals.userMessages,
    },
    {
      id: 'total-assistant-replies',
      label: 'Assistant Replies',
      value: summary.totals.assistantReplies,
    },
  ]

  if (summary.totals.promptTokens > 0) {
    totals.push({
      id: 'total-prompt-tokens',
      label: 'Prompt Tokens',
      value: summary.totals.promptTokens,
    })
  }

  if (summary.totals.completionTokens > 0) {
    totals.push({
      id: 'total-completion-tokens',
      label: 'Completion Tokens',
      value: summary.totals.completionTokens,
    })
  }

  totals.push(
    {
      id: 'avg-response-time',
      label: 'Avg Response Time (ms)',
      value: Number(summary.averages.responseTimeMs.toFixed(1)),
    },
    {
      id: 'avg-prompt-tokens',
      label: 'Avg Prompt Tokens',
      value: Number(summary.averages.promptTokens.toFixed(1)),
    },
    {
      id: 'avg-completion-tokens',
      label: 'Avg Completion Tokens',
      value: Number(summary.averages.completionTokens.toFixed(1)),
    },
  )

  const chronological = [...summary.recent].reverse()

  const responseTimePoints = chronological.map((interaction, index) => ({
    label: formatChartLabel(interaction.timestamp, index),
    value: interaction.responseTimeMs,
  }))

  const totalTokenPoints = chronological
    .map((interaction, index) => ({
      label: formatChartLabel(interaction.timestamp, index),
      value: (interaction.promptTokens ?? 0) + (interaction.completionTokens ?? 0),
    }))
    .filter((point) => point.value > 0)

  const userMessagePoints = chronological
    .map((interaction, index) => ({
      label: formatChartLabel(interaction.timestamp, index),
      value: interaction.userMessages,
    }))
    .filter((point) => point.value > 0)

  const charts = [] as Array<{
    id: string
    title: string
    points: { label: string; value: number }[]
  }>

  if (responseTimePoints.length > 0) {
    charts.push({
      id: 'response-time',
      title: 'Response Time (ms)',
      points: responseTimePoints,
    })
  }

  if (totalTokenPoints.length > 0) {
    charts.push({
      id: 'token-usage',
      title: 'Total Tokens per Chat',
      points: totalTokenPoints,
    })
  }

  if (userMessagePoints.length > 0) {
    charts.push({
      id: 'user-messages',
      title: 'User Messages per Chat',
      points: userMessagePoints,
    })
  }

  const trends = [] as Array<{
    id: string
    metric: string
    change?: number
    direction: 'up' | 'down' | 'flat'
    description?: string
  }>

  if (chronological.length >= 2) {
    const earliest = chronological[0]
    const latest = chronological[chronological.length - 1]

    const responseTimeChange = percentageChange(latest.responseTimeMs, earliest.responseTimeMs)
    if (responseTimeChange !== null) {
      const direction = changeDirection(responseTimeChange)
      trends.push({
        id: 'response-time-trend',
        metric: 'Response time',
        change: Number(responseTimeChange.toFixed(1)),
        direction,
        description:
          direction === 'down'
            ? 'Responses are faster than at the start of this window.'
            : direction === 'up'
              ? 'Responses have slowed compared to earlier chats.'
              : 'Response times are steady.',
      })
    }

    const earliestTokens = (earliest.promptTokens ?? 0) + (earliest.completionTokens ?? 0)
    const latestTokens = (latest.promptTokens ?? 0) + (latest.completionTokens ?? 0)
    const tokenChange = percentageChange(latestTokens, earliestTokens)

    if (tokenChange !== null) {
      const direction = changeDirection(tokenChange)
      trends.push({
        id: 'token-usage-trend',
        metric: 'Token usage',
        change: Number(tokenChange.toFixed(1)),
        direction,
        description:
          direction === 'down'
            ? 'Token usage is decreasing per interaction.'
            : direction === 'up'
              ? 'Later chats are using more tokens.'
              : 'Token usage is steady across chats.',
      })
    }
  }

  const timeframe = chronological.length
    ? chronological.length === 1
      ? 'Most recent interaction'
      : `Last ${chronological.length} interactions`
    : undefined

  const totalTokens = summary.totals.promptTokens + summary.totals.completionTokens

  const concerns = summary.commonConcerns.map((concern) => ({
    id: concern.id,
    label: concern.label,
    category: concern.category,
    description: concern.description,
    guidance: concern.guidance,
    count: concern.count,
    share: concern.share ?? 0,
    lastExample: concern.lastExample,
    lastMentionedAt: concern.lastMentionAt,
  }))

  const conditions = summary.commonConditions.map((condition) => ({
    id: condition.id,
    label: condition.label,
    category: condition.category,
    description: condition.description,
    guidance: condition.guidance,
    count: condition.count,
    share: condition.share ?? 0,
    lastExample: condition.lastExample,
    lastMentionedAt: condition.lastMentionAt,
  }))

  const highlights = summary.totals.requests
    ? [
        {
          id: 'avg-response-highlight',
          title: 'Consistent response time',
          description: `Average response time ${Math.round(summary.averages.responseTimeMs)} ms across ${summary.totals.requests} chats.`,
        },
        {
          id: 'token-highlight',
          title: 'Token usage',
          description: `${totalTokens} total tokens processed so far.`,
        },
      ]
    : [
        {
          id: 'no-activity',
          title: 'No conversations yet',
          description: 'Start chatting with HealthMate to see engagement analytics here.',
        },
      ]

  if (concerns.length > 0) {
    const topConcern = concerns[0]
    const sharePercent = Math.round((topConcern.share ?? 0) * 1000) / 10
    highlights.unshift({
      id: `top-concern-${topConcern.id}`,
      title: `${topConcern.label} is trending`,
      description: topConcern.lastExample
        ? `Mentioned ${topConcern.count} times (${sharePercent}% of user messages). Recent example: “${topConcern.lastExample}”.`
        : `Mentioned ${topConcern.count} times (${sharePercent}% of user messages) in recent chats.`,
    })
  }

  if (conditions.length > 0) {
    const topCondition = conditions[0]
    const sharePercent = Math.round((topCondition.share ?? 0) * 1000) / 10
    highlights.unshift({
      id: `top-condition-${topCondition.id}`,
      title: `${topCondition.label} frequently mentioned`,
      description: topCondition.lastExample
        ? `Logged ${topCondition.count} times (${sharePercent}% of user messages). Sample context: “${topCondition.lastExample}”.`
        : `Logged ${topCondition.count} times (${sharePercent}% of user messages) in recent chats.`,
    })
  }

  res.json({
    totals,
    charts,
    trends,
    timeframe,
    updatedAt: summary.lastInteractionAt,
    highlights,
    concerns,
    conditions,
  })
})

analyticsRouter.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message,
        type: error.name,
      })
    }

    return res.status(500).json({
      error: 'Unknown analytics error',
    })
  },
)

export default analyticsRouter
