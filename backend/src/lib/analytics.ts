type ChatInteraction = {
  timestamp: number
  userMessages: number
  promptTokens: number | null
  completionTokens: number | null
  responseTimeMs: number
}

type ConcernDefinition = {
  id: string
  label: string
  category: string
  description: string
  guidance: string
  matchers: RegExp[]
}

type ConcernStat = {
  count: number
  lastExample: string | null
  lastMentionAt: number | null
}

type ConditionDefinition = {
  id: string
  label: string
  category: string
  description: string
  guidance: string
  matchers: RegExp[]
}

type ConditionStat = {
  count: number
  lastExample: string | null
  lastMentionAt: number | null
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

const concernDefinitions: ConcernDefinition[] = [
  {
    id: 'chest-discomfort',
    label: 'Chest pain or pressure',
    category: 'Physical symptoms',
    description: 'Mentions of chest pain, tightness, or pressure during conversations.',
    guidance: 'Remind users to seek urgent care when severe chest discomfort or breathing difficulty is reported.',
    matchers: [
      /chest (pain|hurting|pressure|tight(ness)?)/i,
      /(tight|pain)ness? in (my|the) chest/i,
    ],
  },
  {
    id: 'breathing-difficulty',
    label: 'Breathing difficulty',
    category: 'Physical symptoms',
    description: 'Indicators of shortness of breath or difficulty breathing.',
    guidance: 'Escalate messaging about emergency care when breathing is impaired.',
    matchers: [
      /short(ness)? of breath/i,
      /difficulty breathing/i,
      /hard (to|time) breathe/i,
    ],
  },
  {
    id: 'fever',
    label: 'Fever or chills',
    category: 'Physical symptoms',
    description: 'References to fever, high temperature, or persistent chills.',
    guidance: 'Encourage tracking temperature and consulting clinicians if fever persists.',
    matchers: [
      /high (fever|temperature)/i,
      /running a fever/i,
      /have (a )?fever/i,
      /chills? and fever/i,
    ],
  },
  {
    id: 'headache',
    label: 'Headaches or migraines',
    category: 'Physical symptoms',
    description: 'Mentions of head pain, migraines, or pressure.',
    guidance: 'Surface hydration, rest, and escalation messaging when headaches are severe or sudden.',
    matchers: [
      /migraine/i,
      /bad headache/i,
      /head (pain|hurting)/i,
    ],
  },
  {
    id: 'anxiety',
    label: 'Anxiety or stress',
    category: 'Mental wellbeing',
    description: 'Messages highlighting anxious thoughts or panic sensations.',
    guidance: 'Share coping strategies and encourage professional mental health support.',
    matchers: [
      /feel(ing)? anxious/i,
      /anxiety attack/i,
      /panic (attack|attacks)/i,
      /overwhelmed and anxious/i,
    ],
  },
]

const conditionDefinitions: ConditionDefinition[] = [
  {
    id: 'feverish-illness',
    label: 'Feverish illness',
    category: 'Infectious',
    description: 'Mentions of fever, chills, or body aches that may signal a viral infection.',
    guidance: 'Encourage rest, hydration, and medical advice for persistent or high fevers.',
    matchers: [
      /\bfever(ish)?\b/i,
      /running a fever/i,
      /high (fever|temperature)/i,
      /chills? (and|with)? (fever|body aches?)/i,
    ],
  },
  {
    id: 'respiratory-infection',
    label: 'Respiratory infection',
    category: 'Respiratory',
    description: 'References to flu, COVID-19, pneumonia, or persistent cough with breathing issues.',
    guidance: 'Prompt testing, masking, and escalation when breathing becomes difficult.',
    matchers: [
      /\bflu\b/i,
      /influenza/i,
      /covid(-19)?/i,
      /coronavirus/i,
      /pneumonia/i,
      /bronchitis/i,
      /persistent cough/i,
      /trouble breathing/i,
    ],
  },
  {
    id: 'digestive-illness',
    label: 'Digestive illness',
    category: 'Gastrointestinal',
    description: 'Mentions of stomach bugs, food poisoning, vomiting, or diarrhea.',
    guidance: 'Remind users to stay hydrated and seek urgent care for dehydration or blood in stool.',
    matchers: [
      /stomach (bug|flu)/i,
      /food poisoning/i,
      /vomit(ing)?/i,
      /diarr(hea|hoea)/i,
      /nausea/i,
      /queasy stomach/i,
    ],
  },
  {
    id: 'common-cold',
    label: 'Common cold',
    category: 'Upper respiratory',
    description: 'Mentions of sore throat, runny or stuffy nose, and mild cough typical of a cold.',
    guidance: 'Suggest rest, fluids, and monitoring for symptoms that escalate or persist.',
    matchers: [
      /(have|having|caught|catching|got|getting|coming down with) (a )?cold/i,
      /runny nose/i,
      /stuffy nose/i,
      /nasal congestion/i,
      /sore throat/i,
      /post-nasal drip/i,
    ],
  },
  {
    id: 'skin-irritation',
    label: 'Skin irritation',
    category: 'Dermatology',
    description: 'Reports of rashes, hives, eczema flare-ups, or other irritated skin.',
    guidance: 'Encourage gentle skin care, avoiding triggers, and medical attention for spreading rashes.',
    matchers: [
      /skin rash/i,
      /\brash(es)?\b/i,
      /eczema/i,
      /hives/i,
      /itchy (skin|spots?)/i,
    ],
  },
]

const concernStats: Record<string, ConcernStat> = Object.fromEntries(
  concernDefinitions.map((definition) => [
    definition.id,
    {
      count: 0,
      lastExample: null,
      lastMentionAt: null,
    },
  ]),
) as Record<string, ConcernStat>

const conditionStats: Record<string, ConditionStat> = Object.fromEntries(
  conditionDefinitions.map((definition) => [
    definition.id,
    {
      count: 0,
      lastExample: null,
      lastMentionAt: null,
    },
  ]),
) as Record<string, ConditionStat>

const RECENT_LIMIT = 25
const recentInteractions: ChatInteraction[] = []

const truncateExample = (text: string): string => {
  const trimmed = text.trim()
  if (trimmed.length <= 160) {
    return trimmed
  }

  return `${trimmed.slice(0, 157)}…`
}

const trackConversationSignals = (userMessageContents: string[]) => {
  if (!userMessageContents.length) {
    return
  }

  const timestamp = Date.now()

  userMessageContents.forEach((content) => {
    if (!content || !content.trim()) {
      return
    }

    const concernMatches = concernDefinitions.filter((definition) =>
      definition.matchers.some((matcher) => matcher.test(content)),
    )

    const conditionMatches = conditionDefinitions.filter((definition) =>
      definition.matchers.some((matcher) => matcher.test(content)),
    )

    if (concernMatches.length === 0 && conditionMatches.length === 0) {
      return
    }

    const example = truncateExample(content)

    concernMatches.forEach((definition) => {
      const stat = concernStats[definition.id]
      stat.count += 1
      stat.lastExample = example
      stat.lastMentionAt = timestamp
    })

    conditionMatches.forEach((definition) => {
      const stat = conditionStats[definition.id]
      stat.count += 1
      stat.lastExample = example
      stat.lastMentionAt = timestamp
    })
  })
}

export type ChatMetricsPayload = {
  userMessages: number
  userMessageContents?: string[]
  promptTokens?: number | null
  completionTokens?: number | null
  responseTimeMs: number
}

export function recordChatMetrics({
  userMessages,
  userMessageContents = [],
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

  if (userMessageContents.length > 0) {
    trackConversationSignals(userMessageContents)
  }

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
  const totalUserMessages = metrics.totalUserMessages

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
    commonConcerns: concernDefinitions
      .map((definition) => {
        const stat = concernStats[definition.id]
        return {
          id: definition.id,
          label: definition.label,
          category: definition.category,
          description: definition.description,
          guidance: definition.guidance,
          count: stat.count,
          share: totalUserMessages > 0 ? stat.count / totalUserMessages : 0,
          lastExample: stat.lastExample,
          lastMentionAt: stat.lastMentionAt ? new Date(stat.lastMentionAt).toISOString() : null,
        }
      })
      .filter((concern) => concern.count > 0)
      .sort((a, b) => b.count - a.count),
    commonConditions: conditionDefinitions
      .map((definition) => {
        const stat = conditionStats[definition.id]
        return {
          id: definition.id,
          label: definition.label,
          category: definition.category,
          description: definition.description,
          guidance: definition.guidance,
          count: stat.count,
          share: totalUserMessages > 0 ? stat.count / totalUserMessages : 0,
          lastExample: stat.lastExample,
          lastMentionAt: stat.lastMentionAt ? new Date(stat.lastMentionAt).toISOString() : null,
        }
      })
      .filter((condition) => condition.count > 0)
      .sort((a, b) => b.count - a.count),
  }
}
