import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// POST /api/webhooks/fal - Handle Fal.ai webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Received Fal.ai webhook:", JSON.stringify(body, null, 2));

    // Extract webhook data
    const { request_id, status, payload, metadata } = body;

    // Verify webhook signature if needed (optional but recommended for production)
    // const signature = request.headers.get('x-fal-signature');
    // if (!verifyWebhookSignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Handle different webhook types
    if (status === "COMPLETED" && payload) {
      // Process completed job
      const processedPayload = await processWebhookPayload(payload, metadata);

      // Here you could store the result in a database, send notifications, etc.
      // For now, we'll just log it
      console.log("Processed webhook payload:", processedPayload);

      return NextResponse.json({
        success: true,
        request_id,
        status,
        processed: true,
      });
    } else if (status === "FAILED") {
      // Handle failed jobs
      console.error("Fal.ai job failed:", { request_id, payload, metadata });

      return NextResponse.json({
        success: false,
        request_id,
        status,
        error: payload,
      });
    }

    // Return success for other statuses
    return NextResponse.json({
      success: true,
      request_id,
      status,
    });
  } catch (error) {
    console.error("Error processing Fal.ai webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

// Utility function to process webhook payload and store media
async function processWebhookPayload(
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>
) {
  const processedPayload = { ...payload };

  // Extract model info from metadata if available
  const modelName = metadata?.model || "unknown";
  const requestId = metadata?.request_id || "unknown";

  // Process media files in the payload
  const mediaFields = ["images", "image", "video", "audio", "videos", "audios"];

  for (const field of mediaFields) {
    if (processedPayload[field]) {
      if (Array.isArray(processedPayload[field])) {
        // Handle array of media files
        processedPayload[field] = await Promise.all(
          (processedPayload[field] as unknown[]).map(
            async (item: unknown, index: number) => {
              const itemObj = item as Record<string, unknown>;
              if (
                itemObj &&
                typeof itemObj === "object" &&
                itemObj.url &&
                typeof itemObj.url === "string"
              ) {
                const storedUrl = await storeWebhookMediaFile(
                  itemObj.url as string,
                  (modelName || "unknown") as string,
                  (requestId || "unknown") as string,
                  `${field}_${index}`
                );
                return {
                  ...itemObj,
                  original_url: itemObj.url as string,
                  stored_url: storedUrl,
                  webhook_processed: true,
                };
              }
              return itemObj;
            }
          )
        );
      } else if (
        processedPayload[field] &&
        typeof processedPayload[field] === "object" &&
        (processedPayload[field] as any).url &&
        typeof (processedPayload[field] as any).url === "string"
      ) {
        // Handle single media file
        const storedUrl = await storeWebhookMediaFile(
          (processedPayload[field] as any).url as string,
          (modelName || "unknown") as string,
          (requestId || "unknown") as string,
          field
        );
        processedPayload[field] = {
          ...processedPayload[field],
          original_url: (processedPayload[field] as any).url as string,
          stored_url: storedUrl,
          webhook_processed: true,
        };
      }
    }
  }

  return {
    ...processedPayload,
    webhook_metadata: {
      processed_at: new Date().toISOString(),
      model: modelName,
      request_id: requestId,
    },
  };
}

// Utility function to store media file from webhook in Vercel Blob
async function storeWebhookMediaFile(
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

    // Create a unique filename for webhook storage
    const extension = getFileExtension(contentType);
    const filename = `webhook_${modelName.replace(
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
    console.error("Error storing webhook media file:", error);
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

// Optional: Verify webhook signature (implement based on Fal.ai documentation)
// function verifyWebhookSignature(signature: string | null, body: any): boolean {
//   // Implement signature verification logic here
//   // This would typically involve checking the signature against a hash of the body
//   return true; // Placeholder
// }
