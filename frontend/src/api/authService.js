const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

const request = async (endpoint, body) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.message || 'An error occurred')
  }

  return data
}

export const register = (fullName, email, phone, password, confirmPassword) =>
  request('/auth/register', { fullName, email, phone, password, confirmPassword })

export const login = (email, password) => request('/auth/login', { email, password })

export const forgotPassword = (email) => request('/auth/forgot-password?email=' + encodeURIComponent(email), {})

export const resetPassword = (token, newPassword) =>
  request(`/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`, {})

export const getToken = () => localStorage.getItem('authToken')

export const saveToken = (token) => localStorage.setItem('authToken', token)

export const clearToken = () => localStorage.removeItem('authToken')
