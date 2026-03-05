import axios from "axios"
import type {
  ChannelListResponse,
  Channel,
  ScrapeRun,
  Subgenre,
  Quota,
  Stats,
} from "./types"

const api = axios.create({ baseURL: "/api" })

// Channels
export async function fetchChannels(params: {
  page?: number
  page_size?: number
  search?: string
  min_score?: number
  has_email?: boolean
  is_buyable?: boolean
  subgenre?: string
  sort_by?: string
  sort_dir?: string
}): Promise<ChannelListResponse> {
  const { data } = await api.get("/channels", { params })
  return data
}

export async function fetchChannel(id: string): Promise<Channel> {
  const { data } = await api.get(`/channels/${id}`)
  return data
}

export async function deleteChannel(id: string): Promise<void> {
  await api.delete(`/channels/${id}`)
}

export async function updateChannel(
  id: string,
  body: { notes?: string | null },
): Promise<Channel> {
  const { data } = await api.patch(`/channels/${id}`, body)
  return data
}

// Scraping
export async function startScraping(body: {
  subgenres: string[]
  demo_mode: boolean
}): Promise<ScrapeRun> {
  const { data } = await api.post("/scraping/start", body)
  return data
}

export async function stopScraping(runId: string): Promise<void> {
  await api.post(`/scraping/${runId}/stop`)
}

export async function fetchRuns(): Promise<ScrapeRun[]> {
  const { data } = await api.get("/scraping/runs")
  return data
}

export async function fetchSubgenres(): Promise<Subgenre[]> {
  const { data } = await api.get("/scraping/subgenres")
  return data
}

export async function fetchQuota(): Promise<Quota> {
  const { data } = await api.get("/scraping/quota")
  return data
}

// Stats
export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get("/stats")
  return data
}

// Exports
export function getExportCsvUrl(params?: {
  min_score?: number
  has_email?: boolean
  subgenre?: string
}): string {
  const search = new URLSearchParams()
  if (params?.min_score) search.set("min_score", String(params.min_score))
  if (params?.has_email) search.set("has_email", "true")
  if (params?.subgenre) search.set("subgenre", params.subgenre)
  const qs = search.toString()
  return `/api/export/csv${qs ? `?${qs}` : ""}`
}

export function getExportEmailsUrl(): string {
  return "/api/export/emails"
}
