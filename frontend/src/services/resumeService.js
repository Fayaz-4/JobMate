import apiClient from '../api/apiClient'

export const getResume = async () => {
  const response = await apiClient.get('/resume')
  return response.data
}

export const uploadResume = async (formData) => {
  const response = await apiClient.post('/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const replaceResume = async (id, formData) => {
  const response = await apiClient.put(`/resume/replace/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const deleteResume = async (id) => {
  const response = await apiClient.delete(`/resume/${id}`)
  return response.data
}
