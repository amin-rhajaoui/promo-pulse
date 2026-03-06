export interface Channel {
  id: string
  youtube_id: string
  title: string
  custom_url: string | null
  description: string | null
  thumbnail_url: string | null
  country: string | null
  published_at: string | null
  subscriber_count: number
  video_count: number
  view_count: number
  emails_pro: string[]
  emails_personal: string[]
  social_links: Record<string, string>
  has_submit_form: boolean
  submit_urls: string[]
  subgenres: string[]
  score: number
  tier: string | null
  notes: string | null
  last_upload_at: string | null
  is_buyable: boolean
  authenticity_score: number
  authenticity_label: string
  authenticity_signals: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ChannelListResponse {
  items: Channel[]
  total: number
  page: number
  page_size: number
}

export interface ScrapeRun {
  id: string
  status: string
  selected_subgenres: string[]
  total_keywords: number
  completed_keywords: number
  channels_found: number
  emails_found: number
  quota_used: number
  current_keyword: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Subgenre {
  id: string
  name: string
  keyword_count: number
}

export interface Quota {
  used: number
  limit: number
  remaining: number
}

export interface Stats {
  total_channels: number
  channels_with_email: number
  avg_score: number
  total_runs: number
  total_emails: number
  tier_distribution: Record<string, number>
  subgenre_distribution: Record<string, number>
  score_distribution: Record<string, number>
}

export interface ScrapeProgress {
  type: string
  status: string
  total_keywords: number
  completed_keywords: number
  channels_found: number
  emails_found: number
  quota_used: number
  current_keyword: string | null
  message?: string
}
