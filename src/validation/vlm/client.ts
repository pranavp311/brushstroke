/**
 * VLM Client for Animation Validation
 * 
 * Supports multiple providers: Ollama (local), Together AI, Fireworks, OpenAI
 */

import { VLMConfig, DEFAULT_VLM_CONFIG } from "./types.js";

export interface VLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class VLMClient {
  private config: VLMConfig;

  constructor(config: Partial<VLMConfig> = {}) {
    this.config = { ...DEFAULT_VLM_CONFIG, ...config };
  }

  /**
   * Analyze a single image frame
   */
  async analyzeImage(
    imageBase64: string,
    prompt: string
  ): Promise<VLMResponse> {
    switch (this.config.provider) {
      case "ollama":
        return this.analyzeWithOllama(imageBase64, prompt);
      case "together":
        return this.analyzeWithTogether(imageBase64, prompt);
      case "fireworks":
        return this.analyzeWithFireworks(imageBase64, prompt);
      case "openai":
        return this.analyzeWithOpenAI(imageBase64, prompt);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Analyze multiple frames (for temporal consistency)
   */
  async analyzeImageSequence(
    framesBase64: string[],
    prompt: string
  ): Promise<VLMResponse> {
    // For most VLMs, we'll analyze frames in batches
    const batchSize = 4;
    const results: string[] = [];

    for (let i = 0; i < framesBase64.length; i += batchSize) {
      const batch = framesBase64.slice(i, i + batchSize);
      const batchPrompt = `${prompt}\n\nAnalyze these ${batch.length} consecutive frames (frames ${i + 1} to ${i + batch.length}):`;
      
      const response = await this.analyzeImageBatch(batch, batchPrompt);
      results.push(response.content);
    }

    // Final synthesis
    const synthesisPrompt = `Synthesize the following frame analyses into a temporal consistency assessment:\n${results.join("\n---\n")}`;
    return this.analyzeWithTextOnly(synthesisPrompt);
  }

  /**
   * Analyze multiple images in a single prompt (all visible at once for cross-image context)
   */
  async analyzeMultipleImages(
    imagesBase64: string[],
    prompt: string
  ): Promise<VLMResponse> {
    if (this.config.provider === "ollama") {
      // Ollama's /api/generate supports multi-image via the `images` array (qwen2.5-vl, llava)
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          images: imagesBase64,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.response,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    }

    // For OpenAI-compatible APIs: single request with multiple image_url content items
    const contentItems: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: prompt },
    ];
    for (const img of imagesBase64) {
      contentItems.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${img}` },
      });
    }

    const apiUrl =
      this.config.provider === "together"
        ? "https://api.together.xyz/v1/chat/completions"
        : this.config.provider === "fireworks"
        ? "https://api.fireworks.ai/inference/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: "user", content: contentItems }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`${this.config.provider} API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  /**
   * Ollama (local) provider
   */
  private async analyzeWithOllama(
    imageBase64: string,
    prompt: string
  ): Promise<VLMResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  }

  /**
   * Together AI provider
   */
  private async analyzeWithTogether(
    imageBase64: string,
    prompt: string
  ): Promise<VLMResponse> {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Together API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  /**
   * Fireworks AI provider
   */
  private async analyzeWithFireworks(
    imageBase64: string,
    prompt: string
  ): Promise<VLMResponse> {
    const response = await fetch(
      `https://api.fireworks.ai/inference/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: { url: `data:image/png;base64,${imageBase64}` },
                },
              ],
            },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Fireworks API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  /**
   * OpenAI provider (GPT-4V)
   */
  private async analyzeWithOpenAI(
    imageBase64: string,
    prompt: string
  ): Promise<VLMResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  /**
   * Batch image analysis (for temporal consistency)
   */
  private async analyzeImageBatch(
    frames: string[],
    prompt: string
  ): Promise<VLMResponse> {
    // Build content array with all frames
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: prompt },
    ];

    for (const frame of frames) {
      content.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${frame}` },
      });
    }

    // Use appropriate API based on provider
    if (this.config.provider === "ollama") {
      // Ollama doesn't support multiple images well, so analyze one at a time
      const results: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const framePrompt = `${prompt}\n\nFrame ${i + 1}:`;
        const result = await this.analyzeWithOllama(frames[i], framePrompt);
        results.push(result.content);
      }
      return {
        content: results.join("\n\n"),
      };
    }

    // For other providers, send all frames
    const response = await fetch(
      this.config.provider === "together"
        ? "https://api.together.xyz/v1/chat/completions"
        : this.config.provider === "fireworks"
        ? "https://api.fireworks.ai/inference/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: "user", content }],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  /**
   * Text-only analysis (for synthesis)
   */
  private async analyzeWithTextOnly(prompt: string): Promise<VLMResponse> {
    // Implementation depends on provider
    // For simplicity, using OpenAI-compatible format
    const response = await fetch(
      this.config.provider === "ollama"
        ? `${this.config.baseUrl}/api/generate`
        : "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.provider !== "ollama" && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: this.config.provider === "ollama" ? prompt : undefined,
          messages:
            this.config.provider !== "ollama"
              ? [{ role: "user", content: prompt }]
              : undefined,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: this.config.provider === "ollama" ? data.response : data.choices[0].message.content,
    };
  }
}
