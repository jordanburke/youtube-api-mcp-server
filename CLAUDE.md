# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
YouTube API MCP Server is a Model Context Protocol (MCP) server implementation that enables AI language models to interact with YouTube content through a standardized interface. It provides comprehensive access to YouTube's video, channel, playlist, and transcript data via the YouTube Data API v3. The server supports both stdio and HTTP transports using FastMCP.

## Development Commands

### Build and Run
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start the server
npm start

# Development mode with auto-rebuild on changes
npm run dev
```

### Publishing
```bash
# Build before publishing (runs automatically via prepublishOnly)
npm publish
```

## Architecture

### Project Structure
- **ES Modules**: Project uses ES module syntax (`"type": "module"` in package.json)
- **TypeScript**: Compiles to ES2022 with ESNext modules
- **Entry Points**:
  - `src/index.ts` - Main server entry point
  - `src/cli.ts` - CLI wrapper for npm global installation
  - `src/server.ts` - MCP server implementation

### Core Services
Located in `src/services/`:
- `video.ts` - YouTube video operations (search, get details, statistics)
- `channel.ts` - Channel information and video listings
- `playlist.ts` - Playlist management and items retrieval
- `transcript.ts` - Video transcript/caption retrieval

### MCP Tool Structure
The server exposes tools following the naming convention `{resource}_{action}`:
- `videos_getVideo` - Get video details
- `videos_searchVideos` - Search for videos
- `transcripts_getTranscript` - Get video transcript
- `channels_getChannel` - Get channel info
- `channels_listVideos` - List channel videos
- `playlists_getPlaylist` - Get playlist details
- `playlists_getPlaylistItems` - List playlist videos

### Key Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `fastmcp` - FastMCP framework for multi-transport support
- `googleapis` - Official Google APIs client (YouTube Data API v3)
- `ytdl-core` - YouTube video information extraction
- `youtube-transcript` - Transcript/caption retrieval
- `zod` - Schema validation for tool parameters

## Configuration Requirements

### Environment Variables
- **YOUTUBE_API_KEY** (required): YouTube Data API v3 key from Google Cloud Console
- **YOUTUBE_TRANSCRIPT_LANG** (optional): Default transcript language (defaults to 'en')

### YouTube API Setup
1. Create/select project in Google Cloud Console
2. Enable YouTube Data API v3
3. Create API key credentials
4. Set YOUTUBE_API_KEY environment variable

## Important Implementation Details

### Service Initialization Pattern
Services use lazy initialization to avoid API key errors during import:
```typescript
private initialized = false;

private initialize() {
    if (this.initialized) return;
    // Initialize YouTube client
    this.initialized = true;
}
```

### Error Handling
- API key validation happens at server startup
- Service methods handle YouTube API errors gracefully
- Proper error messages returned to MCP clients

### Type Safety
- TypeScript strict mode is disabled (`"strict": false`)
- Custom type definitions in `src/types/` for external libraries
- Parameter types defined in `src/types.ts`

## Transport Support

### FastMCP Integration
The server uses FastMCP to support multiple transport types:
- **stdio** (default): Traditional MCP communication via standard input/output
- **http**: HTTP streaming for remote access and web integrations

Transport is configured via environment variables:
- `MCP_TRANSPORT`: Set to "stdio" or "http"
- `MCP_HTTP_PORT`: Port for HTTP server (default: 3000)
- `MCP_HTTP_HOST`: Host for HTTP server (default: localhost)

## MCP Integration
Configuration example for Claude Desktop (stdio transport):
```json
{
  "mcpServers": {
    "youtube-api-mcp-server": {
      "command": "youtube-api-mcp-server",
      "env": {
        "YOUTUBE_API_KEY": "your_api_key"
      }
    }
  }
}
```