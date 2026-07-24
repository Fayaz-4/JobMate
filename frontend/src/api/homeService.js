const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

export const fetchHomeStats = async () => {
  const response = await fetch(`${API_BASE_URL}/home`)
  if (!response.ok) {
    throw new Error('Failed to fetch platform statistics')
  }
  return response.json()
}
