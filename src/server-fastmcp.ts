import { FastMCP } from "fastmcp"
import { z } from "zod"
import { VideoService } from "./services/video.js"
import { TranscriptService } from "./services/transcript.js"
import { PlaylistService } from "./services/playlist.js"
import { ChannelService } from "./services/channel.js"

// Initialize services
const videoService = new VideoService()
const transcriptService = new TranscriptService()
const playlistService = new PlaylistService()
const channelService = new ChannelService()

// Create FastMCP server
const server = new FastMCP({
  name: "youtube-api-mcp-server",
  version: "1.0.0",
})

// Add a simple health check tool
server.addTool({
  name: "health",
  description: "Health check endpoint",
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({ status: "ok", timestamp: new Date().toISOString() })
  },
})

// Video tools
server.addTool({
  name: "videos_getVideo",
  description: "Get detailed information about a YouTube video",
  parameters: z.object({
    videoId: z.string().describe("The YouTube video ID"),
    parts: z.array(z.string()).optional().describe("Parts of the video to retrieve"),
  }),
  execute: async (args) => {
    const result = await videoService.getVideo({
      videoId: args.videoId,
      parts: args.parts,
    })
    return JSON.stringify(result, null, 2)
  },
})

server.addTool({
  name: "videos_searchVideos",
  description: "Search for videos on YouTube",
  parameters: z.object({
    query: z.string().describe("Search query"),
    maxResults: z.number().optional().describe("Maximum number of results to return"),
  }),
  execute: async (args) => {
    const result = await videoService.searchVideos({
      query: args.query,
      maxResults: args.maxResults,
    })
    return JSON.stringify(result, null, 2)
  },
})

// Transcript tools
server.addTool({
  name: "transcripts_getTranscript",
  description: "Get the transcript of a YouTube video",
  parameters: z.object({
    videoId: z.string().describe("The YouTube video ID"),
    language: z.string().optional().describe("Language code for the transcript"),
  }),
  execute: async (args) => {
    const result = await transcriptService.getTranscript({
      videoId: args.videoId,
      language: args.language,
    })
    return JSON.stringify(result, null, 2)
  },
})

// Channel tools
server.addTool({
  name: "channels_getChannel",
  description: "Get detailed information about a YouTube channel",
  parameters: z.object({
    channelId: z.string().describe("The YouTube channel ID"),
    parts: z.array(z.string()).optional().describe("Parts of the channel to retrieve"),
  }),
  execute: async (args) => {
    const result = await channelService.getChannel({
      channelId: args.channelId,
      parts: args.parts,
    })
    return JSON.stringify(result, null, 2)
  },
})

server.addTool({
  name: "channels_listVideos",
  description: "List videos from a YouTube channel",
  parameters: z.object({
    channelId: z.string().describe("The YouTube channel ID"),
    maxResults: z.number().optional().describe("Maximum number of results to return"),
    order: z
      .enum(["date", "rating", "viewCount", "relevance", "title", "videoCount"])
      .optional()
      .describe("Order of results"),
  }),
  execute: async (args) => {
    const result = await channelService.listVideos({
      channelId: args.channelId,
      maxResults: args.maxResults,
      order: args.order,
    })
    return JSON.stringify(result, null, 2)
  },
})

// Playlist tools
server.addTool({
  name: "playlists_getPlaylist",
  description: "Get detailed information about a YouTube playlist",
  parameters: z.object({
    playlistId: z.string().describe("The YouTube playlist ID"),
    parts: z.array(z.string()).optional().describe("Parts of the playlist to retrieve"),
  }),
  execute: async (args) => {
    const result = await playlistService.getPlaylist({
      playlistId: args.playlistId,
      parts: args.parts,
    })
    return JSON.stringify(result, null, 2)
  },
})

server.addTool({
  name: "playlists_getPlaylistItems",
  description: "Get items from a YouTube playlist",
  parameters: z.object({
    playlistId: z.string().describe("The YouTube playlist ID"),
    maxResults: z.number().optional().describe("Maximum number of results to return"),
    pageToken: z.string().optional().describe("Page token for pagination"),
  }),
  execute: async (args) => {
    const result = await playlistService.getPlaylistItems({
      playlistId: args.playlistId,
      maxResults: args.maxResults,
      pageToken: args.pageToken,
    })
    return JSON.stringify(result, null, 2)
  },
})

// Export the server and start function
export { server }

export async function startMcpServerFastMCP() {
  // Check for required environment variables
  if (!process.env.YOUTUBE_API_KEY) {
    console.error("Error: YOUTUBE_API_KEY environment variable is required.")
    console.error("Please set it before running this server.")
    process.exit(1)
  }

  // Get transport type from environment or default to stdio
  const transportType = process.env.MCP_TRANSPORT || "stdio"

  if (transportType === "http") {
    const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10)

    await server.start({
      transportType: "httpStream",
      httpStream: {
        port,
      },
    })

    console.log(`YouTube API MCP Server started on HTTP at port ${port}`)
  } else {
    // Default to stdio transport
    await server.start({
      transportType: "stdio",
    })
  }
}
