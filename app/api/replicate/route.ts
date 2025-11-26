import { NextRequest, NextResponse } from "next/server";
import { storeMediaFile } from "@/lib/fal-utils";

// POST /api/replicate - Generate images using Replicate's tylerbishopdev/tyler model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return NextResponse.json(
        {
          success: false,
          error: "REPLICATE_API_TOKEN environment variable is required",
        },
        { status: 500 }
      );
    }

    // Build the input payload for the model
    const input: Record<string, unknown> = {
      prompt: body.prompt,
      num_outputs: body.num_outputs || 4,
      aspect_ratio: body.aspect_ratio || "4:3",
      output_format: body.output_format || "webp",
      output_quality: body.output_quality || 80,
      num_inference_steps: body.num_inference_steps || 28,
      guidance_scale: body.guidance_scale || 3.5,
      lora_scale: body.lora_scale || 1,
      go_fast: body.go_fast !== false, // default true
      disable_safety_checker: body.disable_safety_checker || false,
    };

    // Optional fields
    if (body.seed) input.seed = body.seed;
    if (body.model) input.model = body.model;
    if (body.image) input.image = body.image;
    if (body.mask) input.mask = body.mask;
    if (body.prompt_strength) input.prompt_strength = body.prompt_strength;
    if (body.megapixels) input.megapixels = body.megapixels;
    if (body.extra_lora) input.extra_lora = body.extra_lora;
    if (body.extra_lora_scale) input.extra_lora_scale = body.extra_lora_scale;

    // Use the models endpoint for the trained model
    const response = await fetch(
      "https://api.replicate.com/v1/models/tylerbishopdev/tyler/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({ input }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Replicate API error: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    let result = await response.json();

    // Handle different prediction states
    if (result.status === "failed") {
      return NextResponse.json(
        { success: false, error: result.error || "Prediction failed" },
        { status: 500 }
      );
    }

    // If still processing (shouldn't happen with Prefer: wait, but just in case)
    if (result.status === "processing" || result.status === "starting") {
      result = await pollForCompletion(result.id, replicateToken);
    }

    // Generate a unique request ID
    const requestId = result.id || `replicate-${Date.now()}`;
    const modelName = "tylerbishopdev-tyler";

    // Process and store images in Vercel Blob
    const outputUrls = result.output || [];
    const processedImages = await Promise.all(
      outputUrls.map(async (url: string, index: number) => {
        const storedUrl = await storeMediaFile(
          url,
          modelName,
          requestId,
          `image_${index}`
        );
        return {
          url: url,
          stored_url: storedUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      request_id: requestId,
      images: processedImages,
      retrieved_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in Replicate API route:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate images",
      },
      { status: 500 }
    );
  }
}

// Helper function to poll for prediction completion
async function pollForCompletion(
  predictionId: string,
  token: string,
  maxAttempts = 120
): Promise<{ id: string; output: string[]; status: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to check prediction status: ${response.statusText}`
      );
    }

    const prediction = await response.json();

    if (prediction.status === "succeeded") {
      return prediction;
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(prediction.error || "Prediction failed");
    }

    // Wait 1 second before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Prediction timed out");
}
