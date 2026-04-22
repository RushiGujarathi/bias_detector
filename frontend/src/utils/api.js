import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL })

export async function analyzeDataset(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/api/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getSuggestions(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/api/suggestions', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getSampleDataset() {
  const { data } = await api.get('/api/sample-dataset')
  return data
}