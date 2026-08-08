# Vehicle Wrap Concept API Documentation

## Overview

The Vehicle Wrap Concept API is a secure, server-side endpoint that generates vehicle wrap design concepts using OpenAI's DALL-E and GPT-4 models. It's designed to integrate seamlessly with your Framer-based Think Easy Wrap Lab site.

## Setup Instructions

### 1. Environment Configuration

Add your OpenAI API key to your hosting environment:

```bash
# In your hosting dashboard (Vercel, etc.)
OPENAI_API_KEY=sk-...your-key-here...
FRAMER_ORIGIN=https://your-framer-site.framer.app
```

**Security Note:** Never commit the API key to your repository. Always use environment variables.

### 2. Install Dependencies

The API requires the OpenAI SDK:

```bash
npm install openai
# or
yarn add openai
# or
pnpm add openai
```

## API Endpoint

**POST** `/api/wrap-concept`

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "vehicleType": "van",
  "designDirection": "Modern, minimalist design with geometric patterns. Use company colors blue and white. Include the logo prominently.",
  "companyName": "TechFlow Solutions",
  "contactEmail": "design@techflow.com",
  "revisionNotes": "Make the design more vibrant, add more brand personality"
}
```

**Required Fields:**
- `vehicleType` (string, 1-100 chars): Type of vehicle (e.g., "van", "truck", "car", "bus")
- `designDirection` (string, 1-500 chars): Creative direction for the wrap design
- `companyName` (string, 1-200 chars): Name of the company
- `contactEmail` (string): Valid email address for the contact

**Optional Fields:**
- `revisionNotes` (string, 0-500 chars): Any revision feedback to incorporate

### Response (Success)

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/private/...",
    "conceptTitle": "TechFlow Van Wrap Modern Identity",
    "creativRationale": "The design incorporates TechFlow's brand colors with clean geometric patterns, creating a professional yet dynamic appearance that stands out on the road."
  },
  "metadata": {
    "vehicleType": "van",
    "companyName": "TechFlow Solutions",
    "generatedAt": "2024-08-07T14:30:00.000Z"
  }
}
```

### Response (Error)

**Status:** `400`, `429`, `500`, etc.

```json
{
  "error": "contactEmail is required and must be a valid email address"
}
```

## Error Codes

| Code | Scenario | Solution |
|------|----------|----------|
| `400` | Invalid input (missing fields, invalid format) | Check request payload against schema |
| `429` | Rate limit or quota exceeded | Wait before retrying; check OpenAI account |
| `503` | OpenAI service error | Retry after a few moments |
| `500` | Server error | Check logs; verify API key is set |

## Integration Example

### Using the Client Library

```typescript
import { generateWrapConcept } from '@/lib/wrap-concept-client';

async function createWrapConcept() {
  try {
    const response = await generateWrapConcept(
      {
        vehicleType: 'van',
        designDirection: 'Modern, minimalist design with geometric patterns',
        companyName: 'TechFlow Solutions',
        contactEmail: 'design@techflow.com',
      },
      'https://your-domain.com' // Your API URL
    );

    console.log('Concept Image:', response.data.imageUrl);
    console.log('Title:', response.data.conceptTitle);
    console.log('Rationale:', response.data.creativRationale);
  } catch (error) {
    console.error('Failed to generate concept:', error);
  }
}
```

### From Framer (JavaScript)

```javascript
async function generateWrapConcept(params) {
  const response = await fetch('https://your-domain.com/api/wrap-concept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate concept');
  }

  return response.json();
}

// Usage
const concept = await generateWrapConcept({
  vehicleType: 'van',
  designDirection: 'Modern design with company colors',
  companyName: 'TechFlow Solutions',
  contactEmail: 'design@techflow.com',
});
```

## Security Best Practices

1. **API Key Protection**
   - Store the OpenAI API key only in environment variables
   - Never expose it in client-side code
   - Use read-only or restricted keys if possible

2. **Input Validation**
   - All inputs are validated server-side
   - String lengths are limited to prevent abuse
   - Email addresses are validated

3. **CORS Configuration**
   - Set `FRAMER_ORIGIN` to restrict access to your Framer site
   - Default is `*` (open) for development; restrict in production

4. **Rate Limiting**
   - Implement rate limiting on your hosting platform
   - Monitor OpenAI usage and costs
   - Set up alerts for unexpected usage spikes

## Cost Considerations

Each concept generation calls:
- **DALL-E 3**: $0.080 per image (1024x1024)
- **GPT-4**: ~$0.002 per concept (estimate)

**Typical cost per concept:** ~$0.082

Monitor your OpenAI account for usage trends.

## Deployment Checklist

- [ ] Add `OPENAI_API_KEY` to environment variables (Vercel, hosting platform)
- [ ] Add `FRAMER_ORIGIN` environment variable with your Framer URL
- [ ] Install `openai` package: `npm install openai`
- [ ] Deploy to production
- [ ] Test with a sample request from your Framer site
- [ ] Set up monitoring/alerts for errors
- [ ] Document the endpoint for team access

## Troubleshooting

### "OpenAI API key not configured"
- Verify `OPENAI_API_KEY` is set in your hosting environment
- Restart the deployment after adding the variable

### "Rate limit exceeded"
- OpenAI has hit rate limits; wait a few minutes before retrying
- Check your OpenAI account for plan limits

### "CORS error from Framer"
- Verify `FRAMER_ORIGIN` matches your Framer site URL
- Test with `FRAMER_ORIGIN=*` temporarily (dev only)

### Slow responses
- DALL-E 3 can take 30-60 seconds to generate images
- Set appropriate timeouts in your frontend (e.g., 90 seconds)

## API Limits

- Max request body: 1 MB
- Max string field lengths: 100-500 characters (varies by field)
- Image size: Fixed at 1024x1024
- Response time: 30-60 seconds (typical)

## Support

For OpenAI issues, visit: https://platform.openai.com/account/billing/overview
For deployment issues, check your hosting platform's logs.
