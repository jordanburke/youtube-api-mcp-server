import { MCPFunction, MCPFunctionGroup } from "@modelcontextprotocol/sdk"
import { YoutubeTranscript } from "youtube-transcript"
import * as ytdl from "ytdl-core"
import * as fs from "fs/promises"

// Utility functions
function safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : defaultValue), obj)
}

function safeParse(value: string | number | null | undefined, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue
  const parsed = Number(value)
  return isNaN(parsed) ? defaultValue : parsed
}

function safelyExecute<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch (error: unknown) {
    console.error("Execution error:", error instanceof Error ? error.message : "Unknown error")
    return null
  }
}

export class PlaylistManager implements MCPFunctionGroup {
  private youtube: any

  constructor() {
    this.youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
    })
  }

  @MCPFunction({
    description: "Create intelligent playlist",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        sourceVideos: { type: "array", items: { type: "string" } },
        duration: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title", "sourceVideos"],
    },
  })
  async createSmartPlaylist({
    title,
    sourceVideos,
    duration = 0,
    tags = [],
  }: {
    title: string
    sourceVideos: string[]
    duration?: number
    tags?: string[]
  }): Promise<any> {
    try {
      const playlist = await this.youtube.playlists.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title,
            description: this.generateDescription(tags),
          },
          status: { privacyStatus: "private" },
        },
      })

      const playlistId = playlist.data.id
      const processedVideos = await this.processVideos(sourceVideos, duration)

      for (const video of processedVideos) {
        await this.youtube.playlistItems.insert({
          part: ["snippet"],
          requestBody: {
            snippet: {
              playlistId,
              resourceId: {
                kind: "youtube#video",
                videoId: video.id,
              },
            },
          },
        })
      }

      return {
        id: playlistId,
        videoCount: processedVideos.length,
        totalDuration: processedVideos.reduce((sum, v) => sum + v.duration, 0),
        tags: this.analyzePlaylistTags(processedVideos),
      }
    } catch (error) {
      throw new Error(`Failed to create playlist: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  @MCPFunction({
    description: "Optimize playlist order",
    parameters: {
      type: "object",
      properties: {
        playlistId: { type: "string" },
        optimizationType: { type: "string", enum: ["engagement", "duration", "views", "relevance"] },
      },
      required: ["playlistId"],
    },
  })
  async optimizePlaylist({
    playlistId,
    optimizationType = "engagement",
  }: {
    playlistId: string
    optimizationType?: string
  }): Promise<any> {
    try {
      const items = await this.youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId,
        maxResults: 50,
      })

      const videos = await Promise.all(
        items.data.items.map(async (item: any) => {
          const videoId = item.contentDetails.videoId
          const stats = await this.getVideoStats(videoId)
          return { ...item, stats }
        }),
      )

      const optimizedOrder = this.reorderVideos(videos, optimizationType)
      await this.updatePlaylistOrder(playlistId, optimizedOrder)

      return {
        originalOrder: items.data.items.map((i: any) => i.contentDetails.videoId),
        optimizedOrder: optimizedOrder.map((v: any) => v.contentDetails.videoId),
        metrics: this.calculateOptimizationMetrics(videos, optimizedOrder),
      }
    } catch (error) {
      throw new Error(`Failed to optimize playlist: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  @MCPFunction({
    description: "Generate playlist suggestions",
    parameters: {
      type: "object",
      properties: {
        sourcePlaylistId: { type: "string" },
        maxSuggestions: { type: "number" },
      },
      required: ["sourcePlaylistId"],
    },
  })
  async suggestVideos({
    sourcePlaylistId,
    maxSuggestions = 10,
  }: {
    sourcePlaylistId: string
    maxSuggestions?: number
  }): Promise<any[]> {
    try {
      const items = await this.youtube.playlistItems.list({
        part: ["contentDetails"],
        playlistId: sourcePlaylistId,
      })

      const sourceVideos = items.data.items.map((i: any) => i.contentDetails.videoId)
      const suggestions: any[] = []

      for (const videoId of sourceVideos) {
        const related = await this.youtube.search.list({
          part: ["snippet"],
          relatedToVideoId: videoId,
          type: ["video"],
          maxResults: 5,
        })

        suggestions.push(
          ...(await Promise.all(
            related.data.items
              .filter((item: any) => !sourceVideos.includes(item.id.videoId))
              .map(async (item: any) => ({
                videoId: item.id.videoId,
                title: item.snippet.title,
                relevanceScore: await this.calculateRelevance(videoId, item.id.videoId),
              })),
          )),
        )
      }

      return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, maxSuggestions)
    } catch (error) {
      throw new Error(`Failed to suggest videos: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Private Helper Methods
  private async processVideos(videoIds: string[], targetDuration: number): Promise<any[]> {
    const videos = await Promise.all(
      videoIds.map(async (id) => {
        const details = await this.youtube.videos.list({
          part: ["contentDetails", "statistics", "snippet"],
          id: [id],
        })
        return details.data.items?.[0]
      }),
    )

    if (targetDuration > 0) {
      return this.selectVideosForDuration(videos, targetDuration)
    }

    return videos
  }

  private selectVideosForDuration(videos: any[], targetDuration: number): any[] {
    const selected = []
    let currentDuration = 0

    for (const video of videos) {
      const duration = this.parseDuration(video.contentDetails.duration)
      if (currentDuration + duration <= targetDuration) {
        selected.push(video)
        currentDuration += duration
      }
    }

    return selected
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    let seconds = 0

    if (match?.[1]) seconds += parseInt(match[1]) * 3600
    if (match?.[2]) seconds += parseInt(match[2]) * 60
    if (match?.[3]) seconds += parseInt(match[3])

    return seconds
  }

  private generateDescription(tags: string[]): string {
    if (tags.length === 0) return ""
    return `Curated playlist featuring: ${tags.join(", ")}`
  }

  private async getVideoStats(videoId: string): Promise<any> {
    const response = await this.youtube.videos.list({
      part: ["statistics", "contentDetails"],
      id: [videoId],
    })
    return response.data.items?.[0]
  }

  private reorderVideos(videos: any[], type: string): any[] {
    switch (type) {
      case "engagement":
        return videos.sort((a, b) => {
          const aEngagement =
            (parseInt(a.stats.statistics.likeCount) + parseInt(a.stats.statistics.commentCount)) /
            parseInt(a.stats.statistics.viewCount)
          const bEngagement =
            (parseInt(b.stats.statistics.likeCount) + parseInt(b.stats.statistics.commentCount)) /
            parseInt(b.stats.statistics.viewCount)
          return bEngagement - aEngagement
        })
      case "duration":
        return videos.sort((a, b) => {
          const aDuration = this.parseDuration(a.stats.contentDetails.duration)
          const bDuration = this.parseDuration(b.stats.contentDetails.duration)
          return aDuration - bDuration
        })
      case "views":
        return videos.sort((a, b) => parseInt(b.stats.statistics.viewCount) - parseInt(a.stats.statistics.viewCount))
      case "relevance":
        return this.orderByRelevance(videos)
      default:
        return videos
    }
  }

  private orderByRelevance(videos: any[]): any[] {
    const ordered = [...videos]
    const titleWords = new Map<string, number>()

    videos.forEach((video) => {
      const words = video.stats.snippet.title.toLowerCase().split(/\s+/)
      words.forEach((word) => {
        titleWords.set(word, (titleWords.get(word) || 0) + 1)
      })
    })

    ordered.forEach((video) => {
      const words = video.stats.snippet.title.toLowerCase().split(/\s+/)
      video.relevanceScore = words.reduce((score, word) => score + (titleWords.get(word) || 0), 0)
    })

    return ordered.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private async updatePlaylistOrder(playlistId: string, videos: any[]): Promise<void> {
    for (let i = 0; i < videos.length; i++) {
      await this.youtube.playlistItems.update({
        part: ["snippet"],
        requestBody: {
          id: videos[i].id,
          snippet: {
            playlistId,
            position: i,
            resourceId: {
              kind: "youtube#video",
              videoId: videos[i].contentDetails.videoId,
            },
          },
        },
      })
    }
  }

  private calculateOptimizationMetrics(original: any[], optimized: any[]): any {
    return {
      totalViews: optimized.reduce((sum, v) => sum + parseInt(v.stats.statistics.viewCount), 0),
      averageEngagement:
        optimized.reduce((sum, v) => {
          const engagement =
            (parseInt(v.stats.statistics.likeCount) + parseInt(v.stats.statistics.commentCount)) /
            parseInt(v.stats.statistics.viewCount)
          return sum + engagement
        }, 0) / optimized.length,
      durationSpread: this.calculateDurationSpread(optimized),
      relevanceScore: this.calculateRelevanceScore(optimized),
    }
  }

  private calculateDurationSpread(videos: any[]): number {
    const durations = videos.map((v) => this.parseDuration(v.stats.contentDetails.duration))
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    return Math.sqrt(durations.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / durations.length)
  }

  private calculateRelevanceScore(videos: any[]): number {
    const totalRelevance = videos.reduce((score, video) => {
      return score + (video.relevanceScore || 0)
    }, 0)
    return totalRelevance / videos.length
  }

  private async calculateRelevance(sourceId: string, targetId: string): Promise<number> {
    const [source, target] = await Promise.all([
      this.youtube.videos.list({
        part: ["snippet", "topicDetails"],
        id: [sourceId],
      }),
      this.youtube.videos.list({
        part: ["snippet", "topicDetails"],
        id: [targetId],
      }),
    ])

    let score = 0
    const sourceVideo = source.data.items?.[0]
    const targetVideo = target.data.items?.[0]

    if (sourceVideo?.topicDetails?.topicIds && targetVideo?.topicDetails?.topicIds) {
      const commonTopics = sourceVideo.topicDetails.topicIds.filter((t: string) =>
        targetVideo.topicDetails.topicIds.includes(t),
      )
      score += commonTopics.length * 0.3
    }

    const sourceTags = new Set(sourceVideo?.snippet?.tags || [])
    const targetTags = new Set(targetVideo?.snippet?.tags || [])
    const commonTags = [...sourceTags].filter((t) => targetTags.has(t))
    score += commonTags.length * 0.2

    const sourceWords = new Set((sourceVideo?.snippet?.title || "").toLowerCase().split(/\s+/))
    const targetWords = new Set((targetVideo?.snippet?.title || "").toLowerCase().split(/\s+/))
    const commonWords = [...sourceWords].filter((w) => targetWords.has(w))
    score += commonWords.length * 0.1

    return Math.min(1, score)
  }

  private analyzePlaylistTags(videos: any[]): string[] {
    const tagFrequency = new Map<string, number>()
    videos.forEach((video) => {
      const tags = video.snippet.tags || []
      tags.forEach((tag: string) => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1)
      })
    })
    return [...tagFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag)
  }
}
