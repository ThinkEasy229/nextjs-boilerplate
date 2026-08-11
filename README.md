# Vehicle Wrap Designer

Premium Next.js vehicle wrap designer with:

- vehicle-specific selection cards
- AI-assisted concept generation via `/api/wrap-concept`
- real-time branded mockup previews
- concept gallery and premium upsell flow
- direct sales handoff when a customer wants help instead of purchasing

## Local development

```bash
npm install
npm run dev
```

Create a `.env.local` from `.env.example` if you want live OpenAI-generated concepts:

```bash
cp .env.example .env.local
```

Required for AI concepts:

- `OPENAI_API_KEY`

Optional:

- `FRAMER_ORIGIN` for CORS when embedding from Framer
- `NEXT_PUBLIC_SALES_EMAIL` / `SALES_EMAIL` for the contact-sales CTA
- `NEXT_PUBLIC_SALES_PHONE` for the displayed sales phone number

## API

### `GET /api/wrap-concept`

Returns the vehicle library, premium package details, and sales contact metadata.

### `POST /api/wrap-concept`

Accepts:

```json
{
  "vehicleType": "cargo-van",
  "companyName": "Wrap Lab Pro",
  "contactEmail": "design@wraplabpro.com",
  "industry": "Commercial fleet branding",
  "preferredColors": "Navy, electric blue, orange",
  "designDirection": "Bold, premium, easy-to-read branding with a modern motion feel",
  "tagline": "Turn traffic into trust",
  "goals": "Generate a premium concept that feels ready to purchase immediately."
}
```

Returns three concepts, gallery previews, premium package information, a sales contact path, and a stored session id.

## API Endpoints

### `GET /api/joke`

Returns a random joke from an external joke provider.

Optional query params:

- `type`: `general` (default) or `programming`
- `format`: `structured` (default) or `single`

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
