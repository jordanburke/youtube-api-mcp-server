import { startMcpServerFastMCP } from "./server-fastmcp.js"

// Start the FastMCP server
startMcpServerFastMCP().catch((error) => {
  console.error("Failed to start YouTube API MCP Server:", error)
  process.exit(1)
})
