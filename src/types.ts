/**
 * Video details parameters
 */
export interface VideoParams {
  videoId: string
  parts?: string[]
}

/**
 * Search videos parameters
 */
export interface SearchParams {
  query: string
  maxResults?: number
}

/**
 * Trending videos parameters
 */
export interface TrendingParams {
  regionCode?: string
  maxResults?: number
  videoCategoryId?: string
}

/**
 * Related videos parameters
 */
export interface RelatedVideosParams {
  videoId: string
  maxResults?: number
}

/**
 * Transcript parameters
 */
export interface TranscriptParams {
  videoId: string
  language?: string
}

/**
 * Search transcript parameters
 */
export interface SearchTranscriptParams {
  videoId: string
  query: string
  language?: string
}

/**
 * Channel parameters
 */
export interface ChannelParams {
  channelId: string
  parts?: string[]
}

/**
 * Channel videos parameters
 */
export interface ChannelVideosParams {
  channelId: string
  maxResults?: number
  order?: "date" | "rating" | "viewCount" | "relevance" | "title" | "videoCount"
}

/**
 * Playlist parameters
 */
export interface PlaylistParams {
  playlistId: string
  parts?: string[]
}

/**
 * Playlist items parameters
 */
export interface PlaylistItemsParams {
  playlistId: string
  maxResults?: number
  pageToken?: string
}
