const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const resolvedBaseUrl = rawBaseUrl && rawBaseUrl.length > 0
  ? rawBaseUrl
  : import.meta.env.DEV
    ? 'http://localhost:5050'
    : typeof window !== 'undefined'
      ? window.location.origin
      : ''
const sanitizedBaseUrl = resolvedBaseUrl.replace(/\/+$/, '')
export const API_BASE_URL = sanitizedBaseUrl
export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  return `${API_BASE_URL}${path}`
}