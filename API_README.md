# Fal.ai API Integration

This project provides a complete API integration with Fal.ai models, allowing users to access all available models through a unified interface.

## API Routes

### 1. List Models

**GET** `/api/models`

Returns all available Fal.ai models organized by category.

**Response:**

```json
{
  "success": true,
  "models": [
    {
      "name": "fal-ai/flux-pro/kontext/max/text-to-image",
      "category": "Image generation",
      "endpointId": "fal-ai/flux-pro/kontext/max/text-to-image",
      "isLora": false
    }
  ],
  "categories": ["Image generation", "Video models", "Audio Generation", ...],
  "total": 42
}
```

### 2. Get Model Schema

**GET** `/api/models/[model]`

Returns the input/output schema for a specific model.

**Parameters:**

- `model`: URL-encoded model name (e.g., `fal-ai%2Fflux-pro%2Fkontext%2Fmax%2Ftext-to-image`)

**Response:**

```json
{
  "success": true,
  "model": "fal-ai/flux-pro/kontext/max/text-to-image",
  "endpointId": "fal-ai/flux-pro/kontext/max/text-to-image",
  "category": "text-to-image",
  "documentationUrl": "https://fal.ai/models/fal-ai/flux-pro/kontext/max/text-to-image/api",
  "playgroundUrl": "https://fal.ai/models/fal-ai/flux-pro/kontext/max/text-to-image",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string" },
      "aspect_ratio": { "enum": ["1:1", "16:9", ...] }
    },
    "required": ["prompt"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "images": { "type": "array" },
      "seed": { "type": "integer" }
    }
  }
}
```

### 3. Submit Request

**POST** `/api/submit/[model]`

Submits a request to a Fal.ai model.

**Parameters:**

- `model`: URL-encoded model name

**Request Body:**

```json
{
  "prompt": "A beautiful landscape",
  "aspect_ratio": "16:9",
  "num_images": 1
}
```

**Response:**

```json
{
  "success": true,
  "request_id": "req_123456",
  "status": "IN_QUEUE",
  "response_url": "https://queue.fal.run/...",
  "status_url": "https://queue.fal.run/...",
  "cancel_url": "https://queue.fal.run/...",
  "model": "fal-ai/flux-pro/kontext/max/text-to-image",
  "submitted_at": "2025-10-07T12:00:00.000Z"
}
```

### 4. Check Status

**GET** `/api/submit/[model]?request_id=req_123456`

Checks the status of a submitted request.

**Query Parameters:**

- `request_id`: The request ID returned from submit

**Response:**

```json
{
  "success": true,
  "request_id": "req_123456",
  "status": "COMPLETED",
  "logs": [...],
  "metrics": {...},
  "queue_position": 0,
  "model": "fal-ai/flux-pro/kontext/max/text-to-image"
}
```

### 5. Get Results

**GET** `/api/results/[model]/[requestId]`

Retrieves the final results of a completed request and stores media in Vercel Blob.

**Parameters:**

- `model`: URL-encoded model name
- `requestId`: The request ID

**Response:**

```json
{
  "success": true,
  "request_id": "req_123456",
  "model": "fal-ai/flux-pro/kontext/max/text-to-image",
  "result": {
    "images": [
      {
        "url": "https://v3.fal.media/files/...",
        "width": 1024,
        "height": 1024,
        "original_url": "https://v3.fal.media/files/...",
        "stored_url": "https://blob.vercel-storage.com/..."
      }
    ],
    "seed": 1234567890
  },
  "retrieved_at": "2025-10-07T12:05:00.000Z"
}
```

### 6. Webhook Handler

**POST** `/api/webhooks/fal`

Handles webhooks from Fal.ai when jobs complete.

**Request Body:**

```json
{
  "request_id": "req_123456",
  "status": "COMPLETED",
  "payload": { ... },
  "metadata": { ... }
}
```

## Environment Variables

Copy `example.env.local` to `.env.local` and configure:

```bash
# Required
FAL_KEY=your_fal_ai_api_key_here

# Optional - for webhooks
FAL_WEBHOOK_URL=https://your-deployment.vercel.app/api/webhooks/fal
```

## Model Categories

The API supports all models listed in `ModelReferences.md`:

- **Image generation**: Text-to-image models
- **Reference / trained media models**: Models that work with reference images
- **Video models**: Text-to-video and image-to-video models
- **Avatar models**: AI avatar generation
- **3D assets generation**: 3D model creation
- **Audio Generation**: Text-to-speech and audio models
- **Subject Training Models**: LoRA training models
- **Utility models**: Image editing and processing tools
- **LoRAs**: Pre-trained LoRA weights

## Usage Examples

### Frontend Integration

```javascript
// Get all available models
const models = await fetch("/api/models").then((r) => r.json());

// Get schema for a specific model
const schema = await fetch(
  "/api/models/fal-ai%2Fflux-pro%2Fkontext%2Fmax%2Ftext-to-image"
).then((r) => r.json());

// Submit a request
const submitResponse = await fetch(
  "/api/submit/fal-ai%2Fflux-pro%2Fkontext%2Fmax%2Ftext-to-image",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "A beautiful sunset over mountains",
      aspect_ratio: "16:9",
    }),
  }
).then((r) => r.json());

// Check status
const status = await fetch(
  `/api/submit/fal-ai%2Fflux-pro%2Fkontext%2Fmax%2Ftext-to-image?request_id=${submitResponse.request_id}`
).then((r) => r.json());

// Get results (when status is COMPLETED)
const results = await fetch(
  `/api/results/fal-ai%2Fflux-pro%2Fkontext%2Fmax%2Ftext-to-image/${submitResponse.request_id}`
).then((r) => r.json());
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common errors:

- `400`: Invalid request parameters
- `404`: Model not found
- `500`: Server error or missing environment variables

## File Storage

Generated media files are automatically stored in Vercel Blob Storage with:

- Unique filenames based on model, request ID, and timestamp
- Public access URLs
- Original URLs preserved for reference
- Automatic content-type detection

## Webhooks

For production use, configure webhooks in your Fal.ai dashboard pointing to:

```
https://your-deployment.vercel.app/api/webhooks/fal
```

Webhooks automatically process completed jobs and store media files.
