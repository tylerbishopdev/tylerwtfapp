import { NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

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

    // Configure Fal.ai client
    fal.config({
      credentials: falKey,
    });

    // Submit the request to Fal.ai
    const { request_id } = await fal.queue.submit(modelName, {
      input: body,
    });

    const appId = fal.parseAppId(modelName);
    const queueBase = `https://queue.fal.run/${
      appId.namespace ? `${appId.namespace}/` : ""
    }${appId.owner}/${appId.alias}`;

    void fal.queue
      .subscribeToStatus(modelName, {
        requestId: request_id,
        logs: true,
        onQueueUpdate: (update) => {
          console.log("Queue update:", update);
        },
      })
      .catch((subscribeError) => {
        console.error("Queue subscribe error:", subscribeError);
      });

    return NextResponse.json({
      success: true,
      request_id,
      status: "IN_QUEUE",
      response_url: `${queueBase}/requests/${request_id}`,
      status_url: `${queueBase}/requests/${request_id}/status`,
      cancel_url: `${queueBase}/requests/${request_id}/cancel`,
      model: modelName,
      submitted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error submitting to Fal.ai:", error);
    const status = error instanceof fal.ValidationError ? 422 : 500;
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit request",
      },
      { status }
    );
  }
}

// GET /api/submit/[model] - Get status of a submitted request
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ model: string }> }
) {
  try {
    const params = await context.params;
    const modelName = decodeURIComponent(params.model);
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("request_id");

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "request_id parameter is required" },
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

    // Configure Fal.ai client
    fal.config({
      credentials: falKey,
    });

    // Get the status of the request
    const status = await fal.queue.status(modelName, {
      requestId,
      logs: true,
    });

    return NextResponse.json({
      success: true,
      request_id: requestId,
      status: status.status,
      logs: status.logs,
      metrics: status.metrics,
      queue_position: status.queue_position,
      model: modelName,
      response_url: status.response_url,
    });
  } catch (error) {
    console.error("Error getting status from Fal.ai:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get status",
      },
      { status: 500 }
    );
  }
}
