import { NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";
import { put } from "@vercel/blob";

// GET /api/results/[model]/[requestId] - Get final results and store in blob storage
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ model: string; requestId: string }> }
) {
  try {
    const params = await context.params;
    const modelName = decodeURIComponent(params.model);
    const requestId = params.requestId;

    // Set Fal.ai API key from environment
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { success: false, error: "FAL_KEY environment variable is required" },
        { status: 500 }
      );
    }

    // Configure Fal.ai client
    fal.config({
      credentials: falKey,
    });

    // Get the result from Fal.ai
    const result = (await fal.queue.result(modelName, {
      requestId,
    })) as Record<string, unknown>;

    // Process the result based on the model type
    const processedResult = await processAndStoreResult(
      result,
      modelName,
      requestId
    );

    return NextResponse.json({
      success: true,
      request_id: requestId,
      model: modelName,
      result: processedResult,
      retrieved_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting results from Fal.ai:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get results",
      },
      { status: 500 }
    );
  }
}

// Utility function to process and store media files in Vercel Blob
async function processAndStoreResult(
  result: Record<string, unknown>,
  modelName: string,
  requestId: string
) {
  const processedResult = { ...result };
  const mediaFields = ["images", "image", "video", "audio", "videos", "audios"];

  for (const field of mediaFields) {
    if (processedResult[field]) {
      if (Array.isArray(processedResult[field])) {
        // Handle array of media files
        const mediaArray = processedResult[field] as Array<
          Record<string, unknown>
        >;
        processedResult[field] = await Promise.all(
          mediaArray.map(async (item, index) => {
            const url = getItemUrl(item);
            if (url) {
              const storedUrl = await storeMediaFile(
                url,
                modelName,
                requestId,
                `${field}_${index}`
              );
              return {
                ...item,
                original_url: url,
                stored_url: storedUrl,
              } as Record<string, unknown>;
            }
            return item;
          })
        );
      } else if (
        processedResult[field] &&
        typeof processedResult[field] === "object"
      ) {
        const mediaObject = processedResult[field] as Record<string, unknown>;
        const url = getItemUrl(mediaObject);
        if (url) {
          const storedUrl = await storeMediaFile(
            url,
            modelName,
            requestId,
            field
          );
          processedResult[field] = {
            ...mediaObject,
            original_url: url,
            stored_url: storedUrl,
          } as Record<string, unknown>;
        }
      }
    }
  }

  return processedResult;
}

function getItemUrl(item: Record<string, unknown>): string | null {
  const url = item.url;
  return typeof url === "string" && url.length > 0 ? url : null;
}

// Utility function to store media file in Vercel Blob
async function storeMediaFile(
  url: string,
  modelName: string,
  requestId: string,
  fieldName: string
): Promise<string> {
  try {
    // Fetch the media file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from ${url}`);
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    // Create a unique filename
    const extension = getFileExtension(contentType);
    const filename = `${modelName.replace(
      /\//g,
      "-"
    )}_${requestId}_${fieldName}_${Date.now()}.${extension}`;

    // Store in Vercel Blob
    const blob = await put(filename, buffer, {
      contentType,
      access: "public",
    });

    return blob.url;
  } catch (error) {
    console.error("Error storing media file:", error);
    // Return original URL if storage fails
    return url;
  }
}

// Utility function to get file extension from content type
function getFileExtension(contentType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "audio/wav": "wav",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "application/octet-stream": "bin",
  };

  return extensions[contentType] || "bin";
}
