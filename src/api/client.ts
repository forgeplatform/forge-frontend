import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v2',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (currentPath !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

/**
 * Turn any thrown value from a fetch/axios call into a human-readable
 * one-liner suitable for showing in an error banner. DRF validation
 * errors come back as objects keyed by field name, e.g.
 *   {"name": ["Organization with this name already exists."]}
 * which axios.Error.message reduces to an unhelpful "Request failed
 * with status code 400"; this helper flattens the body instead so the
 * user sees the actual reason.
 */
export function extractApiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data
    if (typeof data === 'string' && data.length > 0) return data
    if (data && typeof data === 'object') {
      const parts: string[] = []
      for (const [field, value] of Object.entries(data as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          parts.push(`${field}: ${value.join(', ')}`)
        } else if (typeof value === 'string') {
          parts.push(`${field}: ${value}`)
        } else {
          parts.push(`${field}: ${JSON.stringify(value)}`)
        }
      }
      if (parts.length > 0) return parts.join('; ')
    }
    return e.message
  }
  if (e instanceof Error) return e.message
  return String(e)
}

export { api }
