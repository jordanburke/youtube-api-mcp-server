import { MCPFunction, MCPFunctionGroup } from "@modelcontextprotocol/sdk"
import { createCanvas, loadImage } from "canvas"
import * as fs from "fs/promises"
import * as path from "path"

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

export class ThumbnailManager implements MCPFunctionGroup {
  private youtube: any

  constructor() {
    this.youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
    })
  }

  @MCPFunction({
    description: "Generate custom thumbnail",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        imageUrl: { type: "string" },
        style: { type: "string", enum: ["gaming", "vlog", "tutorial", "news"] },
      },
      required: ["title"],
    },
  })
  async generateThumbnail({
    title,
    imageUrl,
    style = "vlog",
  }: {
    title: string
    imageUrl?: string
    style?: string
  }): Promise<string> {
    try {
      const canvas = createCanvas(1280, 720)
      const ctx = canvas.getContext("2d")

      if (imageUrl) {
        const image = await loadImage(imageUrl)
        ctx.drawImage(image, 0, 0, 1280, 720)
      } else {
        ctx.fillStyle = this.getStyleBackground(style)
        ctx.fillRect(0, 0, 1280, 720)
      }

      await this.applyStyleEffects(ctx, style)

      this.addStyledText(ctx, title, style)

      const outputDir = path.join(process.cwd(), "thumbnails")
      await fs.mkdir(outputDir, { recursive: true })
      const outputPath = path.join(outputDir, `thumbnail-${Date.now()}.png`)
      const buffer = canvas.toBuffer("image/png")
      await fs.writeFile(outputPath, buffer)

      return outputPath
    } catch (error) {
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  @MCPFunction({
    description: "A/B test thumbnails",
    parameters: {
      type: "object",
      properties: {
        thumbnailPaths: { type: "array", items: { type: "string" } },
        duration: { type: "number" },
      },
      required: ["thumbnailPaths"],
    },
  })
  async abTestThumbnails({
    thumbnailPaths,
    duration = 48,
  }: {
    thumbnailPaths: string[]
    duration?: number
  }): Promise<any> {
    try {
      const results = []
      const hours = duration || 48
      const interval = hours / thumbnailPaths.length

      for (let i = 0; i < thumbnailPaths.length; i++) {
        const startTime = new Date()
        startTime.setHours(startTime.getHours() + i * interval)
        const endTime = new Date(startTime)
        endTime.setHours(endTime.getHours() + interval)

        results.push({
          thumbnail: thumbnailPaths[i],
          schedule: {
            start: startTime.toISOString(),
            end: endTime.toISOString(),
          },
        })
      }

      return results
    } catch (error) {
      throw new Error(`Failed to setup A/B test: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Private style-specific methods
  private getStyleBackground(style: string): string {
    switch (style) {
      case "gaming":
        return "#1a1a1a"
      case "vlog":
        return "#f5f5f5"
      case "tutorial":
        return "#ffffff"
      case "news":
        return "#cc0000"
      default:
        return "#ffffff"
    }
  }

  private async applyStyleEffects(ctx: any, style: string): Promise<void> {
    switch (style) {
      case "gaming":
        this.addGamingEffects(ctx)
        break
      case "vlog":
        this.addVlogEffects(ctx)
        break
      case "tutorial":
        this.addTutorialEffects(ctx)
        break
      case "news":
        this.addNewsEffects(ctx)
        break
    }
  }

  private addGamingEffects(ctx: any): void {
    ctx.shadowColor = "#00ff00"
    ctx.shadowBlur = 20
    ctx.fillStyle = "#00ff00"
    ctx.fillRect(0, 680, 1280, 40)
  }

  private addVlogEffects(ctx: any): void {
    const gradient = ctx.createLinearGradient(0, 0, 1280, 720)
    gradient.addColorStop(0, "rgba(255,255,255,0.1)")
    gradient.addColorStop(1, "rgba(255,255,255,0.3)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1280, 720)
  }

  private addTutorialEffects(ctx: any): void {
    ctx.fillStyle = "#e0e0e0"
    ctx.fillRect(50, 50, 100, 100)
    ctx.fillRect(1130, 50, 100, 100)
  }

  private addNewsEffects(ctx: any): void {
    ctx.fillStyle = "#cc0000"
    ctx.fillRect(0, 0, 1280, 80)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 40px Arial"
    ctx.fillText("BREAKING", 20, 55)
  }

  private addStyledText(ctx: any, text: string, style: string): void {
    ctx.shadowBlur = 0
    switch (style) {
      case "gaming":
        this.addGamingText(ctx, text)
        break
      case "vlog":
        this.addVlogText(ctx, text)
        break
      case "tutorial":
        this.addTutorialText(ctx, text)
        break
      case "news":
        this.addNewsText(ctx, text)
        break
    }
  }

  private addGamingText(ctx: any, text: string): void {
    ctx.font = "bold 80px Arial"
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 4
    ctx.strokeText(text, 50, 650)
    ctx.fillStyle = "#ffffff"
    ctx.fillText(text, 50, 650)
  }

  private addVlogText(ctx: any, text: string): void {
    ctx.font = "70px Arial"
    ctx.fillStyle = "#000000"
    ctx.fillText(text, 50, 650)
  }

  private addTutorialText(ctx: any, text: string): void {
    ctx.font = "bold 60px Arial"
    ctx.fillStyle = "#333333"
    ctx.fillText(text, 50, 650)
  }

  private addNewsText(ctx: any, text: string): void {
    ctx.font = "bold 65px Arial"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(text, 50, 150)
  }
}
