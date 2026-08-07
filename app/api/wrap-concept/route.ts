import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

type WrapConceptRequest = {
  vehicleType: string;
  designDirection: string;
  companyName: string;
  contactEmail: string;
};

type ConceptData = {
  conceptTitle: string;
  creativeRationale: string;
};

const REQUIRED_FIELDS: Array<keyof WrapConceptRequest> = [
  'vehicleType',
  'designDirection',
  'companyName',
  'contactEmail',
];

function getCorsHeaders(request: NextRequest): HeadersInit {
  const configuredOrigins = (process.env.FRAMER_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const requestOrigin = request.headers.get('origin') ?? '';
  const allowOrigin = configuredOrigins.length === 0
    ? '*'
    : configuredOrigins.includes(requestOrigin)
      ? requestOrigin
      : configuredOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function badRequest(message: string, headers: HeadersInit) {
  return NextResponse.json({ success: false, error: message }, { status: 400, headers });
}

function parseConcept(rawContent: string | null | undefined, fallbackCompanyName: string, fallbackVehicleType: string): ConceptData {
  const fallback: ConceptData = {
    conceptTitle: `${fallbackCompanyName} ${fallbackVehicleType} Wrap Concept`,
    creativeRationale: `A professional ${fallbackVehicleType} wrap concept for ${fallbackCompanyName} based on the provided design direction.`,
  };

  if (!rawContent) {
    return fallback;
  }

  const trimmed = rawContent.trim();

  try {
    const parsed = JSON.parse(trimmed) as Partial<ConceptData>;
    if (parsed.conceptTitle && parsed.creativeRationale) {
      return {
        conceptTitle: parsed.conceptTitle,
        creativeRationale: parsed.creativeRationale,
      };
    }
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<ConceptData>;
        if (parsed.conceptTitle && parsed.creativeRationale) {
          return {
            conceptTitle: parsed.conceptTitle,
            creativeRationale: parsed.creativeRationale,
          };
        }
      } catch {
        return fallback;
      }
    }
  }

  return fallback;
}

export async function GET(request: NextRequest) {
  const headers = getCorsHeaders(request);

  return NextResponse.json(
    {
      status: 'ok',
      message: 'Wrap Concept Generator API is live',
      endpoint: '/api/wrap-concept',
      timestamp: new Date().toISOString(),
    },
    { headers }
  );
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders(request);

  let body: Partial<WrapConceptRequest>;
  try {
    body = (await request.json()) as Partial<WrapConceptRequest>;
  } catch {
    return badRequest('Invalid JSON body', headers);
  }

  const normalizedBody = {
    vehicleType: body.vehicleType?.trim() ?? '',
    designDirection: body.designDirection?.trim() ?? '',
    companyName: body.companyName?.trim() ?? '',
    contactEmail: body.contactEmail?.trim() ?? '',
  };

  const missingField = REQUIRED_FIELDS.find((field) => normalizedBody[field].length === 0);
  if (missingField) {
    return badRequest(`Missing required field: ${missingField}`, headers);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedBody.contactEmail)) {
    return badRequest('Invalid contactEmail format', headers);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'OpenAI API key is not configured' },
      { status: 500, headers }
    );
  }

  try {
    const client = new OpenAI({ apiKey });

    const imagePrompt = [
      `Create a professional, photorealistic vehicle wrap design for a ${normalizedBody.vehicleType}.`,
      `Company name: ${normalizedBody.companyName}.`,
      `Design direction: ${normalizedBody.designDirection}.`,
      'Prioritize brand visibility, legibility, and clean commercial styling.',
      'Show a complete, polished wrap concept mockup.',
    ].join(' ');

    const imageResponse = await client.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = imageResponse.data?.find((item) => typeof item.url === 'string')?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate wrap image' },
        { status: 502, headers }
      );
    }

    const conceptResponse = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior vehicle-wrap creative director. Respond with valid JSON only. No markdown.',
        },
        {
          role: 'user',
          content: [
            'Create concise concept copy for this vehicle wrap request:',
            `- Vehicle type: ${normalizedBody.vehicleType}`,
            `- Company name: ${normalizedBody.companyName}`,
            `- Design direction: ${normalizedBody.designDirection}`,
            'Return exactly this JSON shape:',
            '{"conceptTitle":"...","creativeRationale":"..."}',
          ].join('\n'),
        },
      ],
      max_tokens: 250,
    });

    const concept = parseConcept(
      conceptResponse.choices[0]?.message?.content,
      normalizedBody.companyName,
      normalizedBody.vehicleType
    );

    return NextResponse.json(
      {
        success: true,
        imageUrl,
        conceptTitle: concept.conceptTitle,
        creativeRationale: concept.creativeRationale,
        data: {
          imageUrl,
          conceptTitle: concept.conceptTitle,
          creativeRationale: concept.creativeRationale,
        },
        metadata: {
          vehicleType: normalizedBody.vehicleType,
          companyName: normalizedBody.companyName,
          contactEmail: normalizedBody.contactEmail,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200, headers }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate wrap concept';
    const status = message.toLowerCase().includes('rate limit') ? 429 : 500;

    return NextResponse.json({ success: false, error: message }, { status, headers });
  }
}
