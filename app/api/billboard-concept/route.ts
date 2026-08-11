import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type BillboardRequest = {
  formatType: string;
  campaignDuration: string;
  locationRegion: string;
  industry: string;
  budgetTier: string;
  targetAudience: string;
  campaignTitle: string;
  targetDemographic: string;
  keyMessage: string;
  campaignBrief: string;
};

type BillboardResult = {
  imageUrl?: string;
  headline: string;
  bodyCopy: string;
  callToAction: string;
  conceptOne: string;
  conceptTwo: string;
  conceptThree: string;
};

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function validateRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  const req = body as Partial<BillboardRequest>;
  const required: (keyof BillboardRequest)[] = [
    'formatType',
    'campaignDuration',
    'locationRegion',
    'industry',
    'budgetTier',
    'targetAudience',
    'campaignTitle',
    'targetDemographic',
    'keyMessage',
    'campaignBrief',
  ];
  for (const field of required) {
    if (!normalizeString(req[field])) return `Missing required field: ${field}`;
  }
  return null;
}

type ConceptPayload = {
  headline: string;
  bodyCopy: string;
  callToAction: string;
  conceptOne: string;
  conceptTwo: string;
  conceptThree: string;
};

function parseConcepts(raw: string): ConceptPayload {
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof ConceptPayload, unknown>>;
    return {
      headline: normalizeString(parsed.headline) || 'Bold. Bright. Unmissable.',
      bodyCopy: normalizeString(parsed.bodyCopy) || 'Your message. Maximum impact.',
      callToAction: normalizeString(parsed.callToAction) || 'Visit us today.',
      conceptOne: normalizeString(parsed.conceptOne) || 'High-contrast visual with bold headline.',
      conceptTwo: normalizeString(parsed.conceptTwo) || 'Minimalist layout with strong CTA.',
      conceptThree: normalizeString(parsed.conceptThree) || 'Brand-forward design with vivid imagery.',
    };
  } catch {
    return {
      headline: 'Bold. Bright. Unmissable.',
      bodyCopy: 'Your message. Maximum impact.',
      callToAction: 'Visit us today.',
      conceptOne: 'High-contrast visual with bold headline.',
      conceptTwo: 'Minimalist layout with strong CTA.',
      conceptThree: 'Brand-forward design with vivid imagery.',
    };
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ success: false, error: 'Service not configured.' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validationError = validateRequest(body);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const r = body as BillboardRequest;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const imagePrompt = [
    `Create a professional, high-impact billboard advertisement concept.`,
    `Format: ${r.formatType}. Location: ${r.locationRegion}. Industry: ${r.industry}.`,
    `Campaign: "${r.campaignTitle}". Key message: "${r.keyMessage}".`,
    `Target audience: ${r.targetAudience} — ${r.targetDemographic}.`,
    `Budget: ${r.budgetTier}. Duration: ${r.campaignDuration}.`,
    `Brief: ${r.campaignBrief}`,
    `Show a photorealistic billboard design with clear typography, bold visuals, strong contrast, roadside placement perspective. No watermarks or gibberish text.`,
  ].join(' ');

  let imageUrl: string | undefined;
  try {
    const imageResult = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt: imagePrompt,
      size: '1024x1024',
    });
    const item = imageResult?.data?.[0];
    if (item?.url) {
      imageUrl = item.url;
    } else if (item?.b64_json) {
      imageUrl = `data:image/png;base64,${item.b64_json}`;
    }
  } catch {
    // Continue without image
  }

  let concepts: ConceptPayload;
  try {
    const conceptCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || 'gpt-4o',
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a senior outdoor advertising creative strategist. Return ONLY valid JSON with keys: headline, bodyCopy, callToAction, conceptOne, conceptTwo, conceptThree.',
        },
        {
          role: 'user',
          content: [
            `Billboard Format: ${r.formatType}`,
            `Campaign: "${r.campaignTitle}"`,
            `Industry: ${r.industry}`,
            `Location: ${r.locationRegion}`,
            `Audience: ${r.targetAudience} — ${r.targetDemographic}`,
            `Key Message: ${r.keyMessage}`,
            `Duration: ${r.campaignDuration}, Budget: ${r.budgetTier}`,
            `Brief: ${r.campaignBrief}`,
            '',
            'Provide: a compelling headline (<8 words), body copy (<20 words), call to action (<6 words), and three distinct creative direction concepts (2-3 sentences each).',
          ].join('\n'),
        },
      ],
    });
    concepts = parseConcepts(conceptCompletion.choices?.[0]?.message?.content ?? '');
  } catch {
    concepts = parseConcepts('');
  }

  const result: BillboardResult = { ...concepts, imageUrl };
  return NextResponse.json({ success: true, data: result }, { status: 200 });
}

