# Mobile & Desktop Implementation Guide

## Overview

This project now has separate mobile and desktop versions with automatic device detection and routing.

## Structure

```
app/
├── page.tsx              # Desktop version (default)
├── mobile/
│   └── page.tsx          # Mobile version
└── api/                  # Shared API routes (no changes needed)

components/
├── ModelSidebar.tsx      # Desktop sidebar
├── ModelForm.tsx         # Desktop form
├── OutputDisplay.tsx     # Desktop output
└── mobile/
    ├── MobileModelForm.tsx
    └── MobileOutputDisplay.tsx

middleware.ts             # Device detection and routing
```

## How It Works

### 1. **Automatic Device Detection**

The middleware (`middleware.ts`) detects the device type based on the User-Agent header:

- **Mobile devices** → Redirected to `/mobile`
- **Desktop devices** → Served from `/` (root)

### 2. **Shared API Routes**

All API routes under `/api` remain unchanged and work identically for both versions:

- `/api/models` - List all models
- `/api/models/[model]` - Get model schema
- `/api/submit/[model]` - Submit generation request
- `/api/lora-options` - Get LoRA options
- `/api/results/[model]/[requestId]` - Get results
- `/api/webhooks/fal` - Fal.ai webhook

### 3. **Mobile UI Features**

The mobile version has been optimized for small screens:

- **Collapsible Model Selector**: Side sheet that slides in from left
- **Tab Navigation**: Switch between "Generate" and "Outputs" tabs
- **Full-width Forms**: Optimized for touch input
- **Stacked Layout**: Vertical layout instead of horizontal columns
- **Fixed Action Buttons**: Generate button fixed at bottom for easy access
- **Simplified Inputs**: Larger touch targets, reduced complexity

### 4. **Desktop UI Features**

The desktop version maintains the original layout:

- **Fixed Sidebar**: 325px sidebar with woody background
- **Split View**: Form on left, outputs on right
- **Advanced Options**: Collapsible advanced settings
- **Rich Media Display**: Grid layout for multiple outputs

## Testing

### Desktop Testing

1. Open your browser in desktop mode
2. Navigate to `http://localhost:3000`
3. You should see the desktop version with sidebar

### Mobile Testing

**Option 1: Browser Dev Tools**

1. Open Chrome/Firefox DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select a mobile device
4. Navigate to `http://localhost:3000`
5. You'll be automatically redirected to `/mobile`

**Option 2: Real Mobile Device**

1. Find your local IP: `ifconfig | grep inet` (Mac/Linux) or `ipconfig` (Windows)
2. Access from mobile: `http://[YOUR_IP]:3000`
3. You'll be automatically redirected to `/mobile`

## API Behavior

✅ **No Changes Required**

The same API endpoints work for both mobile and desktop versions:

```typescript
// Both versions use identical API calls
fetch("/api/models");
fetch(`/api/models/${encodedModel}`);
fetch(`/api/submit/${encodedModel}`, {
  method: "POST",
  body: JSON.stringify(formData),
});
```

## Middleware Configuration

The middleware runs on all routes except:

- `/api/*` - API routes
- `/_next/*` - Next.js internals
- Static files (images, fonts, etc.)

### Manual Override

Users can manually access either version by typing the URL:

- Desktop users can view mobile: `http://localhost:3000/mobile`
- Mobile users can view desktop: `http://localhost:3000/`

But on next navigation, they'll be redirected back to their device-appropriate version.

## Future Enhancements

Potential improvements:

1. **User Preference Toggle**: Allow users to manually switch between mobile/desktop
2. **Responsive Design**: Use CSS media queries instead of separate routes
3. **Progressive Web App**: Add PWA features for mobile
4. **Offline Support**: Cache models and previous outputs
5. **Touch Gestures**: Swipe to navigate between outputs on mobile

## Troubleshooting

### Mobile version not loading

- Clear browser cache
- Check middleware.ts is in the root directory
- Verify User-Agent detection in Network tab

### Desktop version showing on mobile

- Check if you're using "Request Desktop Site" in mobile browser
- Verify middleware is running: check Network tab for redirects

### API calls failing

- APIs are shared, so if desktop works, mobile should too
- Check browser console for CORS or network errors
- Verify endpoint URLs are relative (not hardcoded)

## Development Tips

- Use `console.log(request.headers.get('user-agent'))` in middleware to debug detection
- Test both versions during development
- Keep API logic in shared `/api` routes
- Mobile-specific UI logic goes in `/components/mobile`

