import { NextRequest, NextResponse } from "next/server";
import { processAndStoreResult } from "@/lib/fal-utils";

// POST /api/submit/[model] - Submit a request to a Fal.ai model
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ model: string }> }
) {
  try {
    const params = await context.params;
    const modelName = decodeURIComponent(params.model);
    const body = await request.json();

    // Validate required fields
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body is required" },
        { status: 400 }
      );
    }

    // Set Fal.ai API key from environment
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { success: false, error: "FAL_KEY environment variable is required" },
        { status: 500 }
      );
    }

    // Make a synchronous request to the model
    const response = await fetch(`https://fal.run/${modelName}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to run model: ${response.statusText} - ${errorText}`
      );
    }

    const result = (await response.json()) as Record<string, unknown>;

    // A unique ID for this request
    const requestId =
      response.headers.get("x-fal-request-id") ?? `local-${Date.now()}`;

    // Process the result
    const processedResult = await processAndStoreResult(
      result,
      modelName,
      requestId
    );

    return NextResponse.json({
      success: true,
      request_id: requestId,
      result: processedResult,
      retrieved_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error submitting request to Fal.ai:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit request",
      },
      { status: 500 }
    );
  }
}

// GET /api/submit/[model] - This is no longer needed with synchronous requests
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        "This endpoint no longer supports GET requests for polling. Use POST for synchronous requests.",
    },
    { status: 405 }
  );
}
