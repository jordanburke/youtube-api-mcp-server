# YouTube API MCP Server
[![smithery badge](https://smithery.ai/badge/@jordanburke/youtube-api)](https://smithery.ai/server/@jordanburke/youtube-api)

A Model Context Protocol (MCP) server implementation for the YouTube API, enabling AI language models to interact with YouTube content through a standardized interface. Supports both stdio and HTTP transports.

## Features

### Video Information
* Get video details (title, description, duration, etc.)
* List channel videos
* Get video statistics (views, likes, comments)
* Search videos across YouTube

### Transcript Management
* Retrieve video transcripts
* Support for multiple languages
* Get timestamped captions
* Search within transcripts

### Channel Management
* Get channel details
* List channel playlists
* Get channel statistics
* Search within channel content

### Playlist Management
* List playlist items
* Get playlist details
* Search within playlists
* Get playlist video transcripts

## Installation

### Quick Setup for Claude Desktop

1. Install the package:
```bash
npm install -g youtube-api-mcp-server
```

2. Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "youtube-api-mcp-server": {
      "command": "youtube-api-mcp-server",
      "env": {
        "YOUTUBE_API_KEY": "your_youtube_api_key_here"
      }
    }
  }
}
```

### Alternative: Using NPX (No Installation Required)

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "youtube-api-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "your_youtube_api_key_here"
      }
    }
  }
}
```

### Installing via Smithery

To install YouTube API MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@jordanburke/youtube-api):

```bash
npx -y @smithery/cli install @jordanburke/youtube-api --client claude
```

## Configuration

### Environment Variables
* `YOUTUBE_API_KEY`: Your YouTube Data API key (required)
* `YOUTUBE_TRANSCRIPT_LANG`: Default language for transcripts (optional, defaults to 'en')

### Transport Configuration
The server supports both stdio (default) and HTTP transports:

* `MCP_TRANSPORT`: Transport type - `stdio` (default) or `http`
* `MCP_HTTP_PORT`: HTTP server port (default: 3000) - only used when transport is `http`
* `MCP_HTTP_HOST`: HTTP server host (default: localhost) - only used when transport is `http`

### Using with Docker

The YouTube API MCP Server is available as a Docker image from GitHub Container Registry. By default, the Docker image runs with HTTP transport on port 3000:

```bash
# Pull the latest image
docker pull ghcr.io/jordanburke/youtube-api-mcp-server:latest

# Run with HTTP transport (default - exposed on port 3000)
docker run --rm \
  -e YOUTUBE_API_KEY="your_youtube_api_key_here" \
  -p 3000:3000 \
  ghcr.io/jordanburke/youtube-api-mcp-server:latest

# Run with stdio transport (for Claude Desktop)
docker run --rm \
  -e YOUTUBE_API_KEY="your_youtube_api_key_here" \
  -e MCP_TRANSPORT="stdio" \
  -i \
  ghcr.io/jordanburke/youtube-api-mcp-server:latest
```

#### Using Docker Compose

1. Create a `.env` file from the example:
```bash
cp .env.example .env
# Edit .env and add your YouTube API key
```

2. Run with Docker Compose:
```bash
# Start the server
docker-compose up -d

# View logs
docker-compose logs -f youtube-mcp-server

# Stop the server
docker-compose down
```

For Claude Desktop configuration with Docker:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "ghcr.io/jordanburke/youtube-api-mcp-server:latest"
      ],
      "env": {
        "YOUTUBE_API_KEY": "your_youtube_api_key_here"
      }
    }
  }
}
```

### Using with HTTP Transport

To run the server with HTTP transport for remote access or web integrations:

```bash
# Using npm
MCP_TRANSPORT=http MCP_HTTP_PORT=8080 youtube-api-mcp-server

# Using Docker
docker run --rm \
  -e YOUTUBE_API_KEY="your_youtube_api_key_here" \
  -e MCP_TRANSPORT="http" \
  -e MCP_HTTP_PORT="8080" \
  -p 8080:8080 \
  ghcr.io/jordanburke/youtube-api-mcp-server:latest
```

#### HTTP Streaming Client Example

The HTTP transport uses Server-Sent Events (SSE) for streaming responses. You can interact with it using any SSE-compatible client:

```javascript
// Example using JavaScript EventSource
const eventSource = new EventSource('http://localhost:3000/events');

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send requests via POST to the main endpoint
fetch('http://localhost:3000', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 1
  })
});
```

### Using with VS Code

For one-click installation, click one of the install buttons below:

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22zubeid-youtube-mcp-server%22%5D%2C%22env%22%3A%7B%22YOUTUBE_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22YouTube+API+Key%22%2C%22password%22%3Atrue%7D%5D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22zubeid-youtube-mcp-server%22%5D%2C%22env%22%3A%7B%22YOUTUBE_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22YouTube+API+Key%22%2C%22password%22%3Atrue%7D%5D&quality=insiders)

### Manual Installation

If you prefer manual installation, first check the install buttons at the top of this section. Otherwise, follow these steps:

Add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "apiKey",
        "description": "YouTube API Key",
        "password": true
      }
    ],
    "servers": {
      "youtube": {
        "command": "npx",
        "args": ["-y", "youtube-api-mcp-server"],
        "env": {
          "YOUTUBE_API_KEY": "${input:apiKey}"
        }
      }
    }
  }
}
```

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "apiKey",
      "description": "YouTube API Key",
      "password": true
    }
  ],
  "servers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "youtube-api-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "${input:apiKey}"
      }
    }
  }
}
```
## YouTube API Setup
1. Go to Google Cloud Console
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create API credentials (API key)
5. Copy the API key for configuration

## Examples

### Managing Videos

```javascript
// Get video details
const video = await youtube.videos.getVideo({
  videoId: "video-id"
});

// Get video transcript
const transcript = await youtube.transcripts.getTranscript({
  videoId: "video-id",
  language: "en"
});

// Search videos
const searchResults = await youtube.videos.searchVideos({
  query: "search term",
  maxResults: 10
});
```

### Managing Channels

```javascript
// Get channel details
const channel = await youtube.channels.getChannel({
  channelId: "channel-id"
});

// List channel videos
const videos = await youtube.channels.listVideos({
  channelId: "channel-id",
  maxResults: 50
});
```

### Managing Playlists

```javascript
// Get playlist items
const playlistItems = await youtube.playlists.getPlaylistItems({
  playlistId: "playlist-id",
  maxResults: 50
});

// Get playlist details
const playlist = await youtube.playlists.getPlaylist({
  playlistId: "playlist-id"
});
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## Contributing
See CONTRIBUTING.md for information about contributing to this repository.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
