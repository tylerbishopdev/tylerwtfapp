# Fal.ai Integration Frontend

This Next.js application provides a complete frontend interface for interacting with Fal.ai models.

## Features

### 🎨 **Model Browser Sidebar**

- Organized view of all available Fal.ai models by category
- Expandable categories with model counts
- Model search and selection
- LoRA support indicators

### 📝 **Dynamic Form Generator**

- Automatically generates forms based on model schemas
- Support for all input types: text, numbers, selects, booleans
- Required field validation
- Default value handling
- Real-time form validation

### 🎬 **Output Display Area**

- Grid view of generated content
- Support for images, videos, and audio
- Click to expand for full details
- Download functionality
- Vercel Blob storage integration

### 🔄 **Real-time Status Updates**

- Live polling of generation status
- Progress indicators
- Error handling and notifications

## Getting Started

### 1. Environment Setup

Copy the example environment file and add your Fal.ai API key:

```bash
cp example.env.local .env.local
```

Add your Fal.ai API key:

```bash
FAL_KEY=your_fal_ai_api_key_here
```

Get your API key from: https://fal.ai/dashboard/keys

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Application Structure

### Components

- **`ModelSidebar`**: Left sidebar with categorized model list
- **`ModelForm`**: Right panel with dynamic form generation
- **`OutputDisplay`**: Top area showing generated content

### API Routes

- **`GET /api/models`**: List all available models
- **`GET /api/models/[model]`**: Get schema for specific model
- **`POST /api/submit/[model]`**: Submit generation request
- **`GET /api/submit/[model]?request_id=...`**: Check generation status
- **`GET /api/results/[model]/[requestId]`**: Get final results
- **`POST /api/webhooks/fal`**: Handle Fal.ai webhooks

## Usage Guide

### 1. Select a Model

- Browse categories in the left sidebar
- Click on any model to load its configuration
- Models are grouped by type (Image, Video, Audio, etc.)

### 2. Configure Parameters

- The form automatically generates based on the model's schema
- Fill in required fields (marked with \*)
- Optional fields have default values where applicable
- Use text areas for prompts and descriptions

### 3. Generate Content

- Click the "Generate" button
- Monitor progress in the status bar
- Wait for completion (may take several minutes for complex models)

### 4. View Results

- Generated content appears in the top output area
- Click on items to view full details
- Download media files directly
- All content is stored in Vercel Blob for reliability

## Model Categories

### Image Generation

- Text-to-image models (Flux, Ideogram, Imagen4)
- Image editing tools (Bria background removal, expand, eraser)

### Video Models

- Text-to-video (Sora, Kling, Wan)
- Image-to-video conversion
- Video effects and editing

### Audio Generation

- Text-to-speech (PlayAI)
- Speech-to-speech conversion (Chatterbox)
- Music generation (Minimax)

### 3D & Creative

- 3D model generation (Tripo3D, Hyper3D)
- Avatar creation
- Sound effects

### Training Models

- LoRA training for portraits and styles
- Voice cloning
- Custom model training

## Technical Details

### Form Generation

The form generator automatically handles:

- **String inputs**: Text fields or textareas for prompts
- **Number inputs**: Numeric fields with min/max validation
- **Boolean inputs**: Checkboxes
- **Enum inputs**: Dropdown selects
- **Array inputs**: Multiple selection where supported

### Media Storage

All generated media is automatically stored in Vercel Blob Storage:

- Unique filenames based on model + timestamp
- Public access URLs
- Automatic fallback to original URLs if storage fails
- Content-type detection and proper file extensions

### Status Polling

- Automatic polling every 2 seconds during generation
- Real-time status updates
- Error handling with user notifications
- Completion detection and result fetching

## Supported Models

The application supports all models listed in `ModelReferences.md`, including:

**Image Generation**: `fal-ai/flux-pro/kontext/max/text-to-image`, `fal-ai/ideogram/v3`, etc.
**Video Models**: `fal-ai/sora-2/text-to-video/pro`, `fal-ai/veo3`, etc.
**Audio**: `fal-ai/playai/tts/dialog`, `fal-ai/minimax-music/v1.5`, etc.
**Training**: `fal-ai/flux-lora-portrait-trainer`, etc.

## Error Handling

The application includes comprehensive error handling:

- Network failures
- Invalid API responses
- Missing environment variables
- Model schema loading errors
- Generation failures

## Development

### Adding New Models

1. Add the model to `ModelReferences.md`
2. Create the schema file in `fal_schemas/`
3. The frontend automatically detects and supports new models

### Customizing UI

- Components use Tailwind CSS for styling
- Shadcn/ui components for consistent design
- Responsive layout that works on all screen sizes

### API Integration

The backend API routes handle all Fal.ai communication:

- Request queuing and status polling
- Result processing and storage
- Webhook handling for async completions

## Troubleshooting

### Common Issues

1. **"FAL_KEY environment variable is required"**

   - Add your Fal.ai API key to `.env.local`

2. **"Schema not found for model"**

   - Ensure the model exists in `ModelReferences.md`
   - Check that the schema file exists in `fal_schemas/`

3. **"Failed to submit request"**

   - Verify your API key is valid
   - Check model availability on Fal.ai

4. **Generation taking too long**
   - Some models (especially video) can take 5-15 minutes
   - Check the status polling for updates

### Performance Tips

- Use specific models for your use case
- Monitor your Fal.ai usage and credits
- Large generations may be queued - be patient
- Webhook integration provides better async handling

## Contributing

The application is designed to be extensible:

- Easy to add new model categories
- Automatic form generation from schemas
- Modular component architecture
- TypeScript for type safety

For questions or issues, check the Fal.ai documentation or create an issue in the repository.
