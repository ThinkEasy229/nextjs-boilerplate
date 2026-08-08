# Deployment Guide for nextjs-boilerplate

## Prerequisites

- Node.js 18+ installed locally
- OpenAI API key from https://platform.openai.com/account/api-keys
- Vercel account connected to your GitHub

## 🚀 CRITICAL: Add OPENAI_API_KEY to Vercel (THIS IS WHY DEPLOYMENTS ARE FAILING)

### Step 1: Get Your OpenAI API Key
1. Go to: https://platform.openai.com/account/api-keys
2. Click **"Create new secret key"**
3. Copy it immediately (you won't see it again)

### Step 2: Add to Vercel Environment Variables
1. Go to: https://vercel.com/dashboard
2. Select **nextjs-boilerplate** project
3. Click **Settings** → **Environment Variables**
4. Click **"Add"** button
5. Fill in:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Paste your API key from Step 1
   - **Environments:** Select all (Production, Preview, Development)
6. Click **Save**

### Step 3: Redeploy
```bash
# Option 1: Push a new commit to trigger deploy
git commit --allow-empty -m "Trigger redeploy with env vars configured"
git push origin wrap-lab-pro

# Option 2: Manually redeploy in Vercel
# Go to Vercel Dashboard → Deployments → Click failed deployment → Redeploy
```

## Local Development

### 1. Setup Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your actual OpenAI API key
# Uncomment FRAMER_ORIGIN if needed
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 4. Test the Wrap Concept API Locally

```bash
curl -X POST http://localhost:3000/api/wrap-concept \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "cargo-van",
    "vehicleYear": "2024",
    "vehicleMake": "Ford",
    "vehicleModel": "Transit",
    "designDirection": "Modern, minimalist design with geometric patterns",
    "companyName": "TechFlow Solutions",
    "contactEmail": "design@techflow.com",
    "industry": "Commercial HVAC",
    "preferredColors": "Blue, white, silver"
  }'
```

## Testing Deployed Endpoint

Once deployment succeeds, test with:

```bash
curl -X POST https://nextjs-boilerplate-wrap-lab.vercel.app/api/wrap-concept \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "pickup",
    "vehicleYear": "2024",
    "vehicleMake": "Ford",
    "vehicleModel": "F-150",
    "designDirection": "Bold, vibrant colors with company branding",
    "companyName": "Your Company Name",
    "contactEmail": "your@email.com",
    "industry": "Home services",
    "preferredColors": "Black, orange, white"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://...",
    "creativeDirectionOne": "...",
    "creativeDirectionTwo": "...",
    "creativeDirectionThree": "..."
  },
  "metadata": {
    "source": "ai",
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "imageUrlExpiresAt": "2024-01-01T00:55:00.000Z"
  }
}
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for image & text generation |
| `FRAMER_ORIGIN` | ❌ No | CORS origin for Framer embeds |

## Troubleshooting

### ❌ "Cannot find module 'openai'"
- Make sure `openai` is in `package.json` dependencies
- Run `npm install`

### ❌ "OpenAI API key not configured"
- Go to Vercel Settings → Environment Variables
- Verify `OPENAI_API_KEY` is added
- Redeploy after adding the variable

### ❌ 401 Unauthorized
- API key is invalid or expired
- Get new key from https://platform.openai.com/account/api-keys
- Update in Vercel Settings → Environment Variables

### ❌ Build Failed
1. Run locally: `npm run build`
2. Check error output
3. Fix issues in code
4. Push to trigger new Vercel build

## Vercel Dashboard

Monitor your deployments at: https://vercel.com/dashboard

Look for:
- Recent deployments status
- Build logs (click a deployment to see details)
- Environment variables configuration

## Next Steps

1. ✅ Add `OPENAI_API_KEY` to Vercel
2. ✅ Redeploy
3. ✅ Verify deployment succeeds
4. ✅ Test the API endpoint
5. ✅ Share the endpoint URL with Wrap Lab team
