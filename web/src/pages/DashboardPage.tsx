import { useCallback, useEffect, useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { buildApiUrl } from '../config/api'
import './DashboardPage.css'

type RawTotalValue =
  | number
  | string
  | {
      id?: string
      label?: string
      value?: number | string
      change?: number
    }

type RawTotals = Record<string, RawTotalValue> | RawTotal[]

type RawTotal = {
  id?: string
  label?: string
  value?: number | string
  change?: number
}

type RawChartPoint = {
  label?: string
  value?: number
}

type RawCharts = Record<string, RawChartPoint[] | undefined> | RawChart[]

type RawChart = {
  id?: string
  name?: string
  title?: string
  points?: RawChartPoint[]
  data?: RawChartPoint[]
}

type RawTrend = {
  id?: string
  metric?: string
  label?: string
  title?: string
  change?: number
  direction?: 'up' | 'down'
  description?: string
}

type RawTopic = {
  id?: string
  label?: string
  category?: string
  description?: string
  guidance?: string
  count?: number
  lastExample?: string
  lastMentionedAt?: string
  share?: number
}

type RawConcern = RawTopic
type RawCondition = RawTopic

type AnalyticsSummary = {
  totals?: RawTotals
  charts?: RawCharts
  trends?: RawTrend[]
  timeframe?: string
  updatedAt?: string
  highlights?: Array<{ id?: string; title?: string; description?: string }>
  concerns?: RawConcern[]
  conditions?: RawCondition[]
}

type NormalizedTotal = {
  id: string
  label: string
  value: number | string
  change?: number
  direction: 'up' | 'down' | 'flat'
}

type NormalizedChart = {
  id: string
  title: string
  points: { label: string; value: number }[]
}

type NormalizedTrend = {
  id: string
  metric: string
  change?: number
  direction: 'up' | 'down' | 'flat'
  description?: string
}

type NormalizedTopic = {
  id: string
  label: string
  category: string
  description?: string
  guidance?: string
  count: number
  lastExample?: string
  lastMentionedAt?: string
  share: number
}

type NormalizedConcern = NormalizedTopic
type NormalizedCondition = NormalizedTopic

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

function formatLabel(raw: string) {
  return raw
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function normalizeTotalEntry(entry: RawTotalValue, fallbackKey: string, index: number): NormalizedTotal {
  const baseId = `total-${index}`
  if (typeof entry === 'number' || typeof entry === 'string') {
    return {
      id: fallbackKey || baseId,
      label: formatLabel(fallbackKey || baseId),
      value: entry,
      direction: 'flat',
    }
  }

  const value = entry?.value ?? '—'
  const change = entry?.change
  let direction: NormalizedTotal['direction'] = 'flat'
  if (typeof change === 'number') {
    if (change > 0) direction = 'up'
    else if (change < 0) direction = 'down'
  }

  const id = entry?.id || fallbackKey || baseId
  const label = entry?.label || formatLabel(fallbackKey || entry?.id || baseId)

  return {
    id,
    label,
    value,
    change,
    direction,
  }
}

function normalizeTotals(totals: RawTotals | undefined): NormalizedTotal[] {
  if (!totals) return []

  if (Array.isArray(totals)) {
    return totals.map((item, index) => normalizeTotalEntry(item, item.id || item.label || `total-${index}`, index))
  }

  return Object.entries(totals).map(([key, entry], index) => normalizeTotalEntry(entry, key, index))
}

function normalizeCharts(charts: RawCharts | undefined): NormalizedChart[] {
  if (!charts) return []

  if (Array.isArray(charts)) {
    return charts
      .map((chart, index) => {
        const points = chart.points || chart.data || []
        return {
          id: chart.id || chart.name || chart.title || `chart-${index}`,
          title: chart.title || chart.name || formatLabel(chart.id || `Chart ${index + 1}`),
          points: points
            .filter((point): point is { label: string; value: number } => typeof point?.label === 'string' && typeof point?.value === 'number')
            .map((point) => ({ label: point.label, value: point.value })),
        }
      })
      .filter((chart) => chart.points.length > 0)
  }

  return Object.entries(charts)
    .map(([key, value]) => {
      const points = Array.isArray(value) ? value : []
      return {
        id: key,
        title: formatLabel(key),
        points: points
          .filter((point): point is { label: string; value: number } => typeof point?.label === 'string' && typeof point?.value === 'number')
          .map((point) => ({ label: point.label, value: point.value })),
      }
    })
    .filter((chart) => chart.points.length > 0)
}

function normalizeTrends(trends: RawTrend[] | undefined, totals: NormalizedTotal[]): NormalizedTrend[] {
  if (trends && trends.length > 0) {
    return trends.map((trend, index) => {
      const change = trend.change
      let direction: NormalizedTrend['direction'] = trend.direction ?? 'flat'
      if (!trend.direction && typeof change === 'number') {
        if (change > 0) direction = 'up'
        else if (change < 0) direction = 'down'
      }

      return {
        id: trend.id || trend.metric || trend.label || `trend-${index}`,
        metric: trend.metric || trend.label || trend.title || formatLabel(trend.id || `Metric ${index + 1}`),
        change,
        direction,
        description: trend.description,
      }
    })
  }

  return totals
    .filter((total) => typeof total.change === 'number')
    .map((total) => ({
      id: `trend-${total.id}`,
      metric: total.label,
      change: total.change,
      direction: total.direction,
    }))
}

function normalizeTopics(items: RawTopic[] | undefined, fallbackPrefix: string, limit?: number): NormalizedTopic[] {
  if (!items) return []

  const normalized = items
    .map((item, index) => {
      const fallbackId = `${fallbackPrefix}-${index}`
      const fallbackLabel = `${formatLabel(fallbackPrefix)} ${index + 1}`
      return {
        id: item.id || fallbackId,
        label: item.label || formatLabel(item.id || fallbackLabel),
        category: item.category || 'General',
        description: item.description,
        guidance: item.guidance,
        count: typeof item.count === 'number' ? item.count : 0,
        lastExample: item.lastExample,
        lastMentionedAt: item.lastMentionedAt,
        share: typeof item.share === 'number' && Number.isFinite(item.share) ? Math.max(item.share, 0) : 0,
      }
    })
    .filter((topic) => topic.count > 0)
    .sort((a, b) => b.count - a.count || b.share - a.share)

  if (typeof limit === 'number') {
    return normalized.slice(0, limit)
  }

  return normalized
}

function normalizeConcerns(concerns: RawConcern[] | undefined): NormalizedConcern[] {
  return normalizeTopics(concerns, 'concern', 6)
}

function normalizeConditions(conditions: RawCondition[] | undefined): NormalizedCondition[] {
  return normalizeTopics(conditions, 'condition', 6)
}

function formatValue(value: number | string) {
  if (typeof value === 'number') {
    return numberFormatter.format(value)
  }
  return value
}

function formatChange(change: number | undefined) {
  if (typeof change !== 'number') return null
  const formatted = `${change > 0 ? '+' : ''}${numberFormatter.format(change)}%`
  return formatted
}

function formatShare(share: number) {
  if (!Number.isFinite(share) || share <= 0) return null
  return `${numberFormatter.format(share * 100)}% of user messages`
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%'
  return `${numberFormatter.format(Math.max(0, value) * 100)}%`
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
}

function asNumber(value: number | string) {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)

      const requestInit: RequestInit = signal ? { signal } : {}

      try {
        const response = await fetch(buildApiUrl('/api/analytics/summary'), requestInit)
        const contentType = response.headers.get('content-type') ?? ''
        const bodyText = await response.text()

        if (signal?.aborted) return

        if (!response.ok) {
          let message = 'Analytics data is temporarily unavailable. Please try again.'

          if (contentType.includes('application/json')) {
            try {
              const payload = JSON.parse(bodyText) as { error?: string; message?: string }
              message = payload.error || payload.message || message
            } catch (parseError) {
              console.error('Failed to parse analytics error response:', parseError)
            }
          } else if (bodyText) {
            console.error('Analytics error response:', bodyText)
          }

          throw new Error(message)
        }

        if (!contentType.includes('application/json')) {
          console.error('Analytics summary returned unexpected content type:', contentType)
          if (bodyText) {
            console.error('Analytics summary response body:', bodyText)
          }
          throw new Error('Analytics data is temporarily unavailable. Please try again.')
        }

        try {
          const parsedSummary = JSON.parse(bodyText) as AnalyticsSummary
          if (signal?.aborted) return
          setSummary(parsedSummary)
        } catch (parseError) {
          console.error('Failed to parse analytics summary response:', parseError, bodyText)
          throw new Error('Analytics data is temporarily unavailable. Please try again.')
        }
      } catch (caughtError) {
        if ((caughtError as Error).name === 'AbortError') return

        const fallbackMessage = 'Analytics data is temporarily unavailable. Please try again.'
        if (caughtError instanceof Error) {
          const message = caughtError.name === 'TypeError' ? fallbackMessage : caughtError.message
          setError(message || fallbackMessage)
        } else {
          setError(fallbackMessage)
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    loadSummary(controller.signal)

    return () => controller.abort()
  }, [loadSummary])

  const totals = useMemo(() => normalizeTotals(summary?.totals), [summary?.totals])
  const charts = useMemo(() => normalizeCharts(summary?.charts), [summary?.charts])
  const trends = useMemo(() => normalizeTrends(summary?.trends, totals), [summary?.trends, totals])
  const concerns = useMemo(() => normalizeConcerns(summary?.concerns), [summary?.concerns])
  const conditions = useMemo(() => normalizeConditions(summary?.conditions), [summary?.conditions])
  const updatedAt = formatTimestamp(summary?.updatedAt)

  const totalUserMessages = useMemo(() => {
    const userMessagesEntry = totals.find((total) => total.id === 'total-user-messages')
    return userMessagesEntry ? asNumber(userMessagesEntry.value) : 0
  }, [totals])

  const conditionCategories = useMemo(() => {
    if (conditions.length === 0) return []

    const groups = new Map<string, { count: number; share: number }>()

    conditions.forEach((condition) => {
      const current = groups.get(condition.category) ?? { count: 0, share: 0 }
      current.count += condition.count
      current.share += condition.share
      groups.set(condition.category, current)
    })

    return Array.from(groups.entries())
      .map(([category, stats]) => {
        const share = totalUserMessages > 0 ? stats.count / totalUserMessages : stats.share
        return {
          category,
          count: stats.count,
          share: Math.max(0, Math.min(1, share)),
        }
      })
      .sort((a, b) => b.count - a.count || b.share - a.share)
      .slice(0, 4)
  }, [conditions, totalUserMessages])

  const topCondition = conditions[0]
  const topConcern = concerns[0]
  const hasCharts = charts.length > 0
  const hasTrends = trends.length > 0
  const hasHighlights = Boolean(summary?.highlights && summary.highlights.length > 0)
  const hasConditions = conditions.length > 0
  const hasConcerns = concerns.length > 0
  const hasTotals = totals.length > 0
  const hasAnyContent = hasTotals || hasCharts || hasTrends || hasHighlights || hasConditions || hasConcerns

  return (
    <>
      <Navbar />
      <main className="dashboard">
        <div className="dashboard__container">
          <header className="dashboard__hero">
            <div className="dashboard__breadcrumbs" aria-label="Breadcrumb">
              <span>Dashboards</span>
              <span aria-hidden="true">/</span>
              <span>Condition analytics</span>
            </div>
            <div className="dashboard__hero-row">
              <div className="dashboard__hero-copy">
                <h1>Virtual Care Operations</h1>
                <p>Monitor chat throughput, response efficiency, and the conditions most frequently raised with HealthMate.</p>
              </div>
              <div className="dashboard__hero-meta">
                {summary?.timeframe && <span className="dashboard__pill">{summary.timeframe}</span>}
                {updatedAt && (
                  <div className="dashboard__updated-block">
                    <span className="dashboard__updated-label">Last updated</span>
                    <time dateTime={summary?.updatedAt ?? undefined}>{updatedAt}</time>
                  </div>
                )}
              </div>
            </div>
          </header>

          <nav className="dashboard__tabs" aria-label="Analytics views">
            <ul role="tablist">
              <li role="presentation">
                <span role="tab" aria-selected="true" className="dashboard__tab dashboard__tab--active">
                  Condition analytics
                </span>
              </li>
              <li role="presentation">
                <span role="tab" aria-selected="false" aria-disabled="true" className="dashboard__tab">
                  Engagement
                </span>
              </li>
              <li role="presentation">
                <span role="tab" aria-selected="false" aria-disabled="true" className="dashboard__tab">
                  Operations
                </span>
              </li>
              <li role="presentation">
                <span role="tab" aria-selected="false" aria-disabled="true" className="dashboard__tab">
                  Care coordination
                </span>
              </li>
            </ul>
          </nav>

          {loading && (
            <section className="dashboard__state" aria-live="polite">
              <div className="dashboard__spinner" aria-hidden="true" />
              <p>Loading analytics…</p>
            </section>
          )}

          {error && !loading && (
            <section className="dashboard__state dashboard__state--error" role="alert">
              <p>{error}</p>
              <button type="button" className="dashboard__retry" disabled={loading} onClick={() => loadSummary()}>
                Try again
              </button>
            </section>
          )}

          {!loading && !error && hasAnyContent && (
            <div className="dashboard__content">
              {hasTotals && (
                <section className="dashboard__panel dashboard__panel--kpis" aria-label="Operational KPIs">
                  <header className="dashboard__panel-header">
                    <div>
                      <h2>Hospital Operation KPIs</h2>
                      <p>Baseline indicators pulled from recent HealthMate conversations.</p>
                    </div>
                    {topConcern && (
                      <div className="dashboard__kpi-highlight">
                        <span className="dashboard__chip">Symptom watch</span>
                        <strong>{topConcern.label}</strong>
                        <span>{formatShare(topConcern.share) ?? '—'}</span>
                      </div>
                    )}
                  </header>
                  <div className="dashboard__kpi-grid">
                    {totals.slice(0, 6).map((total) => {
                      const formattedChange = formatChange(total.change)
                      return (
                        <article key={total.id} className="dashboard__kpi-card">
                          <h3>{total.label}</h3>
                          <p className="dashboard__kpi-value">{formatValue(total.value)}</p>
                          {formattedChange && (
                            <span className={`dashboard__change dashboard__change--${total.direction}`}>
                              {total.direction === 'up' && '▲'}
                              {total.direction === 'down' && '▼'}
                              {total.direction === 'flat' && '■'} {formattedChange}
                            </span>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </section>
              )}

              <div className="dashboard__grid">
                <div className="dashboard__column dashboard__column--primary">
                  {topCondition && (
                    <section className="dashboard__panel dashboard__spotlight" aria-label="Top condition spotlight">
                      <header className="dashboard__panel-header">
                        <div>
                          <h2>Top condition spotlight</h2>
                          <p>Most frequently cited illness across the latest chat sessions.</p>
                        </div>
                        <span className="dashboard__chip">{topCondition.category}</span>
                      </header>
                      <div className="dashboard__spotlight-content">
                        <div className="dashboard__spotlight-summary">
                          <h3>{topCondition.label}</h3>
                          <p className="dashboard__spotlight-metric">
                            <strong>{topCondition.count}</strong> {topCondition.count === 1 ? 'mention' : 'mentions'}
                          </p>
                          <p className="dashboard__spotlight-share">{formatShare(topCondition.share) ?? '—'}</p>
                          {topCondition.lastMentionedAt && (
                            <span className="dashboard__spotlight-updated">
                              Last surfaced {formatTimestamp(topCondition.lastMentionedAt)}
                            </span>
                          )}
                        </div>
                        <div className="dashboard__spotlight-details">
                          {topCondition.description && <p>{topCondition.description}</p>}
                          {topCondition.guidance && <p className="dashboard__spotlight-guidance">{topCondition.guidance}</p>}
                          {topCondition.lastExample && (
                            <blockquote>
                              <span aria-hidden="true">“</span>
                              {topCondition.lastExample}
                              <span aria-hidden="true">”</span>
                            </blockquote>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {hasCharts && (
                    <section className="dashboard__panel" aria-label="Recent performance charts">
                      <header className="dashboard__panel-header">
                        <div>
                          <h2>Patient operations</h2>
                          <p>Response timing and token usage trends across recent HealthMate interactions.</p>
                        </div>
                      </header>
                      <div className="dashboard__charts-grid">
                        {charts.map((chart) => {
                          const maxValue = Math.max(...chart.points.map((point) => point.value), 0) || 1
                          return (
                            <article key={chart.id} className="dashboard__chart-card">
                              <h3>{chart.title}</h3>
                              <ul>
                                {chart.points.map((point) => (
                                  <li key={point.label}>
                                    <span className="dashboard__chart-label">{point.label}</span>
                                    <div className="dashboard__chart-bar" aria-hidden="true">
                                      <div
                                        className="dashboard__chart-bar-fill"
                                        style={{ width: `${Math.round((point.value / maxValue) * 100)}%` }}
                                      />
                                    </div>
                                    <span className="dashboard__chart-value">{numberFormatter.format(point.value)}</span>
                                  </li>
                                ))}
                              </ul>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {hasTrends && (
                    <section className="dashboard__panel" aria-label="Trend insights">
                      <header className="dashboard__panel-header">
                        <div>
                          <h2>Operational deltas</h2>
                          <p>Week-over-week movement in key service metrics.</p>
                        </div>
                      </header>
                      <div className="dashboard__trends-grid">
                        {trends.map((trend) => {
                          const changeLabel = formatChange(trend.change)
                          return (
                            <article key={trend.id} className="dashboard__trend-card">
                              <header>
                                <span className={`dashboard__trend-icon dashboard__trend-icon--${trend.direction}`} aria-hidden="true">
                                  {trend.direction === 'up' && '↑'}
                                  {trend.direction === 'down' && '↓'}
                                  {trend.direction === 'flat' && '→'}
                                </span>
                                <h3>{trend.metric}</h3>
                              </header>
                              {changeLabel ? (
                                <p className="dashboard__trend-change">{changeLabel}</p>
                              ) : (
                                <p className="dashboard__trend-change dashboard__trend-change--muted">—</p>
                              )}
                              {trend.description && <p className="dashboard__trend-description">{trend.description}</p>}
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {hasHighlights && (
                    <section className="dashboard__panel" aria-label="Highlights">
                      <header className="dashboard__panel-header">
                        <div>
                          <h2>Highlights</h2>
                          <p>Noteworthy shifts from the latest analytics run.</p>
                        </div>
                      </header>
                      <ul className="dashboard__highlights-list">
                        {summary?.highlights?.map((highlight, index) => (
                          <li key={highlight.id || `highlight-${index}`}>
                            <strong>{highlight.title}</strong>
                            {highlight.description && <p>{highlight.description}</p>}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                <aside className="dashboard__column dashboard__column--sidebar" aria-label="Condition and symptom breakdown">
                  {conditionCategories.length > 0 && (
                    <section className="dashboard__panel" aria-label="Condition mix by category">
                      <header className="dashboard__panel-header">
                        <div>
                          <h2>Condition mix</h2>
                          <p>How illness mentions group across service lines.</p>
                        </div>
                      </header>
                      <ul className="dashboard__category-list">
                        {conditionCategories.map((category) => (
                          <li key={category.category}>
                            <div className="dashboard__category-row">
                              <span>{category.category}</span>
                              <strong>{category.count}</strong>
                            </div>
                            <div className="dashboard__category-bar" aria-hidden="true">
                              <div
                                className="dashboard__category-bar-fill"
                                style={{ width: `${Math.round(category.share * 100)}%` }}
                              />
                            </div>
                            <span className="dashboard__category-share">{formatPercent(category.share)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {hasConditions && (
                    <section className="dashboard__panel" aria-label="Condition leaderboard">
                      <header className="dashboard__panel-header">
                        <div>
                          <h2>Condition leaderboard</h2>
                          <p>Top conditions surfaced in recent chats.</p>
                        </div>
                      </header>
                      <ul className="dashboard__leaderboard">
                        {conditions.map((condition) => {
                          const sharePercent = Math.max(0, Math.round(condition.share * 1000) / 10)
                          return (
                            <li key={condition.id}>
                              <div className="dashboard__leaderboard-row">
                                <div>
                                  <span className="dashboard__chip">{condition.category}</span>
                                  <h3>{condition.label}</h3>
                                </div>
                                <div className="dashboard__leaderboard-metric">
                                  <strong>{condition.count}</strong>
                                  <span>{condition.count === 1 ? 'mention' : 'mentions'}</span>
                                </div>
                              </div>
                              <div className="dashboard__leaderboard-share" aria-hidden="true">
                                <div className="dashboard__leaderboard-share-bar">
                                  <div className="dashboard__leaderboard-share-fill" style={{ width: `${sharePercent}%` }} />
                                </div>
                                <span>{numberFormatter.format(sharePercent)}%</span>
                              </div>
                              {condition.lastExample && (
                                <p className="dashboard__leaderboard-example">“{condition.lastExample}”</p>
                              )}
                              {condition.guidance && (
                                <p className="dashboard__leaderboard-guidance">{condition.guidance}</p>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )}

                  {hasConcerns && (
                    <section className="dashboard__panel" aria-label="Symptom watchlist">
                      <header className="dashboard__panel-header">
                        <div>
                          <h2>Symptom watchlist</h2>
                          <p>Common chat themes that may require care team follow up.</p>
                        </div>
                      </header>
                      <ul className="dashboard__leaderboard dashboard__leaderboard--concerns">
                        {concerns.map((concern) => {
                          const sharePercent = Math.max(0, Math.round(concern.share * 1000) / 10)
                          return (
                            <li key={concern.id}>
                              <div className="dashboard__leaderboard-row">
                                <div>
                                  <span className="dashboard__chip dashboard__chip--secondary">{concern.category}</span>
                                  <h3>{concern.label}</h3>
                                </div>
                                <div className="dashboard__leaderboard-metric">
                                  <strong>{concern.count}</strong>
                                  <span>{concern.count === 1 ? 'mention' : 'mentions'}</span>
                                </div>
                              </div>
                              <div className="dashboard__leaderboard-share" aria-hidden="true">
                                <div className="dashboard__leaderboard-share-bar">
                                  <div className="dashboard__leaderboard-share-fill" style={{ width: `${sharePercent}%` }} />
                                </div>
                                <span>{numberFormatter.format(sharePercent)}%</span>
                              </div>
                              {concern.lastExample && (
                                <p className="dashboard__leaderboard-example">“{concern.lastExample}”</p>
                              )}
                              {concern.guidance && (
                                <p className="dashboard__leaderboard-guidance">{concern.guidance}</p>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )}
                </aside>
              </div>
            </div>
          )}

          {!loading && !error && !hasAnyContent && (
            <section className="dashboard__state dashboard__state--empty">
              <p>No analytics data available yet. Check back soon!</p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default DashboardPage
