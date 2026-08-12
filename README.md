# Vehicle Wrap Designer

Premium Next.js vehicle wrap designer with:

- vehicle-specific selection cards
- AI-assisted concept generation via `/api/wrap-concept`
- real OpenAI vehicle-wrap renders for submitted briefs
- three written creative directions plus premium upsell flow
- direct sales handoff when a customer wants help instead of purchasing
- JSON-backed HR operations, design studio, client onboarding, and driver onboarding portals

## Local development

```bash
npm install
npm run dev
```

Create a `.env.local` from `.env.example` if you want live OpenAI-generated concepts:

```bash
cp .env.example .env.local
```

If you are not enabling Clerk auth yet, leave the Clerk variables blank. Do not use placeholder strings such as
`undefined`, `null`, `pk_test_replace_with_real_key`, or `sk_test_replace_with_real_key`. When you do enable Clerk,
set both values to real keys from the Clerk dashboard.

Required for AI concepts:

- `OPENAI_API_KEY`

Optional:

- `FRAMER_ORIGIN` for CORS when embedding from Framer
- `NEXT_PUBLIC_SALES_EMAIL` / `SALES_EMAIL` for backup sales email contact
- `NEXT_PUBLIC_SALES_PHONE` for the displayed sales phone number
- `NEXT_PUBLIC_SALES_URL` / `SALES_URL` for the human-led sales consult link
- `NEXT_PUBLIC_PREMIUM_CHECKOUT_URL` for the premium concept checkout link

## Operations portals

- `/hr-operations`
- `/design-studio`
- `/client-onboard`
- `/driver-onboard`

See `/SETUP.md` for seeded credentials, invite flow, and setup details.

## API

### `GET /api/wrap-concept`

Returns the vehicle library, premium package details, and sales contact metadata.

### `POST /api/wrap-concept`

Accepts:

```json
{
  "vehicleType": "cargo-van",
  "vehicleYear": "2024",
  "vehicleMake": "Ford",
  "vehicleModel": "Transit",
  "companyName": "Wrap Lab Pro",
  "contactEmail": "design@wraplabpro.com",
  "industry": "Commercial fleet branding",
  "preferredColors": "Navy, electric blue, orange",
  "designDirection": "Bold, premium, easy-to-read branding with a modern motion feel",
  "tagline": "Turn traffic into trust",
  "goals": "Generate a premium concept that feels ready to purchase immediately."
}
```

Returns a single DALL-E image URL, three written creative directions, vehicle metadata, premium package information, a sales contact path, and a stored session id.
