import * as fal from "@fal-ai/serverless-client";
import { put } from "@vercel/blob";

// Configure Fal.ai client
export function configureFalClient() {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error("FAL_KEY environment variable is required");
  }

  fal.config({
    credentials: falKey,
  });
}

// Utility function to get file extension from content type
export function getFileExtension(contentType: string): string {
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

// Utility function to store media file in Vercel Blob
export async function storeMediaFile(
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

// Utility function to process result and store media files
export async function processAndStoreResult(
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
        processedResult[field] = await Promise.all(
          (processedResult[field] as unknown[]).map(
            async (item: Record<string, unknown>, index: number) => {
              if (item && typeof item === "object" && item.url) {
                const storedUrl = await storeMediaFile(
                  item.url,
                  modelName,
                  requestId,
                  `${field}_${index}`
                );
                return {
                  ...item,
                  original_url: item.url,
                  stored_url: storedUrl,
                };
              }
              return item;
            }
          )
        );
      } else if (
        processedResult[field] &&
        typeof processedResult[field] === "object" &&
        processedResult[field].url
      ) {
        // Handle single media file
        const storedUrl = await storeMediaFile(
          processedResult[field].url,
          modelName,
          requestId,
          field
        );
        processedResult[field] = {
          ...processedResult[field],
          original_url: processedResult[field].url,
          stored_url: storedUrl,
        };
      }
    }
  }

  return processedResult;
}

// Utility function to validate model input against schema
export function validateModelInput(
  input: Record<string, unknown>,
  schema: Record<string, unknown>
): { isValid: boolean; errors?: string[] } {
  // Basic validation - you might want to use a proper JSON schema validator like ajv
  if (!schema || !schema.properties) {
    return { isValid: true }; // No schema to validate against
  }

  const errors: string[] = [];
  const required = schema.required || [];

  // Check required fields
  for (const field of required) {
    if (!(field in input)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check field types (basic validation)
  for (const [field, fieldSchema] of Object.entries(
    schema.properties as Record<string, unknown>
  )) {
    const fieldSchemaTyped = fieldSchema as Record<string, unknown>;
    if (field in input) {
      const value = input[field];
      const expectedType = fieldSchemaTyped.type;

      if (
        expectedType &&
        typeof value !== expectedType &&
        !Array.isArray(value)
      ) {
        // Allow some flexibility for numbers and strings
        if (
          !(
            expectedType === "number" &&
            typeof value === "string" &&
            !isNaN(Number(value))
          )
        ) {
          errors.push(
            `Field ${field} should be of type ${expectedType}, got ${typeof value}`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
