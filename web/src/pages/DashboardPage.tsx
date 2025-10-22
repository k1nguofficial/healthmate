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

type AnalyticsSummary = {
  totals?: RawTotals
  charts?: RawCharts
  trends?: RawTrend[]
  timeframe?: string
  updatedAt?: string
  highlights?: Array<{ id?: string; title?: string; description?: string }>
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

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
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
      } catch (error) {
        if ((error as Error).name === 'AbortError') return

        const fallbackMessage = 'Analytics data is temporarily unavailable. Please try again.'
        if (error instanceof Error) {
          const message = error.name === 'TypeError' ? fallbackMessage : error.message
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
  const updatedAt = formatTimestamp(summary?.updatedAt)

  return (
    <>
      <Navbar />
      <main className="dashboard">
        <header className="dashboard__header">
          <div>
            <p className="dashboard__eyebrow">Analytics</p>
            <h1 className="dashboard__title">HealthMate Dashboard</h1>
            <p className="dashboard__subtitle">
              Track engagement, session quality, and performance metrics to understand how users interact with the HealthMate
              assistant.
            </p>
          </div>
          <div className="dashboard__meta">
            {summary?.timeframe && <span className="dashboard__timeframe">{summary.timeframe}</span>}
            {updatedAt && <span className="dashboard__updated">Updated {updatedAt}</span>}
          </div>
        </header>

        {loading && (
          <section className="dashboard__state" aria-live="polite">
            <div className="dashboard__spinner" aria-hidden="true" />
            <p>Loading analytics…</p>
          </section>
        )}

        {error && !loading && (
          <section className="dashboard__state dashboard__state--error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="dashboard__retry"
              disabled={loading}
              onClick={() => loadSummary()}
            >
              Try again
            </button>
          </section>
        )}

        {!loading && !error && (
          <>
            {totals.length > 0 && (
              <section className="dashboard__totals" aria-label="Key metrics">
                {totals.map((total) => {
                  const formattedChange = formatChange(total.change)
                  return (
                    <article key={total.id} className="dashboard__total-card">
                      <h2>{total.label}</h2>
                      <p className="dashboard__total-value">{formatValue(total.value)}</p>
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
              </section>
            )}

            {charts.length > 0 && (
              <section className="dashboard__charts">
                {charts.map((chart) => {
                  const maxValue = Math.max(...chart.points.map((point) => point.value), 0) || 1
                  return (
                    <article key={chart.id} className="dashboard__chart-card">
                      <h2>{chart.title}</h2>
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
              </section>
            )}

            {trends.length > 0 && (
              <section className="dashboard__trends" aria-label="Trends">
                <h2>Trend insights</h2>
                <div className="dashboard__trends-grid">
                  {trends.map((trend) => {
                    const changeLabel = formatChange(trend.change)
                    return (
                      <article key={trend.id} className="dashboard__trend-card">
                        <header>
                          <span
                            className={`dashboard__trend-icon dashboard__trend-icon--${trend.direction}`}
                            aria-hidden="true"
                          >
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

            {summary?.highlights && summary.highlights.length > 0 && (
              <section className="dashboard__highlights" aria-label="Highlights">
                <h2>Highlights</h2>
                <ul>
                  {summary.highlights.map((highlight, index) => (
                    <li key={highlight.id || `highlight-${index}`}>
                      <strong>{highlight.title}</strong>
                      {highlight.description && <p>{highlight.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {totals.length === 0 && charts.length === 0 && trends.length === 0 && !summary?.highlights?.length && (
              <section className="dashboard__state dashboard__state--empty">
                <p>No analytics data available yet. Check back soon!</p>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

export default DashboardPage
