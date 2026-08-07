import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import {
  createFallbackConcepts,
  createVehicleMockup,
  getSalesContact,
  PREMIUM_PACKAGE,
  validateWrapDesignRequest,
  VEHICLE_LIBRARY,
  type WrapDesignRequest,
  type WrapDesignSessionData,
} from '@/lib/wrap-designer';

export const runtime = 'nodejs';

const STORAGE_DIRECTORY = '/tmp/wrap-designer';
const STORAGE_FILE = path.join(STORAGE_DIRECTORY, 'sessions.json');

interface StoredWrapSession {
  sessionId: string;
  generatedAt: string;
  source: 'ai' | 'fallback';
  data: WrapDesignSessionData;
}

function getCorsHeaders() {
  const origin = process.env.FRAMER_ORIGIN || '*';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function GET(request: NextRequest) {
  const headers = getCorsHeaders();
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  try {
    if (sessionId) {
      const sessions = await readSessions();
      const stored = sessions[sessionId];

      if (!stored) {
        return NextResponse.json({ error: 'Design session not found' }, { status: 404, headers });
      }

      return NextResponse.json(
        {
          success: true,
          data: stored.data,
          metadata: {
            generatedAt: stored.generatedAt,
            source: stored.source,
            stored: true,
          },
        },
        { headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          availableVehicles: VEHICLE_LIBRARY,
          premiumPackage: PREMIUM_PACKAGE,
          contact: getSalesContact(process.env.SALES_EMAIL || process.env.NEXT_PUBLIC_SALES_EMAIL),
        },
      },
      { headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load wrap designer metadata',
      },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders();

  try {
    const body = (await request.json()) as WrapDesignRequest;

    if (!validateWrapDesignRequest(body)) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: vehicleType, companyName, contactEmail, industry, preferredColors, designDirection',
        },
        { status: 400, headers }
      );
    }

    const configuredSalesEmail = process.env.SALES_EMAIL || process.env.NEXT_PUBLIC_SALES_EMAIL;
    const generatedAt = new Date().toISOString();

    let data = createFallbackConcepts(body, configuredSalesEmail);
    let source: 'ai' | 'fallback' = 'fallback';

    if (process.env.OPENAI_API_KEY) {
      try {
        data = await generateAiConcepts(body, configuredSalesEmail);
        source = 'ai';
      } catch {
        data = createFallbackConcepts(body, configuredSalesEmail);
      }
    }

    const sessionId = randomUUID();
    const storedSession: StoredWrapSession = {
      sessionId,
      generatedAt,
      source,
      data: {
        ...data,
        sessionId,
      },
    };

    const stored = await saveSession(storedSession);

    return NextResponse.json(
      {
        success: true,
        data: storedSession.data,
        metadata: {
          generatedAt,
          source,
          stored,
        },
      },
      { headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate wrap concepts',
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

async function generateAiConcepts(
  request: WrapDesignRequest,
  configuredSalesEmail?: string
): Promise<WrapDesignSessionData> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fallback = createFallbackConcepts(request, configuredSalesEmail);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You create premium vehicle wrap design concepts. Return valid JSON with a "concepts" array of exactly 3 items. Each concept must include title, headline, rationale, graphics (array of 3 short strings), layout, premiumFeature, and palette (array of exactly 3 hex colors).',
      },
      {
        role: 'user',
        content: JSON.stringify({
          companyName: request.companyName,
          contactEmail: request.contactEmail,
          industry: request.industry,
          vehicleType: request.vehicleType,
          preferredColors: request.preferredColors,
          designDirection: request.designDirection,
          tagline: request.tagline || '',
          goals: request.goals || '',
        }),
      },
    ],
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message.content;

  if (!content) {
    return fallback;
  }

  let parsed: { concepts?: Array<Record<string, unknown>> } = {};

  try {
    parsed = JSON.parse(content) as { concepts?: Array<Record<string, unknown>> };
  } catch {
    return fallback;
  }

  const concepts = (parsed.concepts || []).slice(0, 3).map((concept, index) => {
    const fallbackConcept = fallback.concepts[index] || fallback.concepts[0];
    const palette = normalizePalette(concept.palette, fallbackConcept.palette);
    const title = asString(concept.title, fallbackConcept.title);
    const headline = asString(concept.headline, fallbackConcept.headline);

    return {
      ...fallbackConcept,
      title,
      headline,
      rationale: asString(concept.rationale, fallbackConcept.rationale),
      graphics: normalizeStringArray(concept.graphics, fallbackConcept.graphics, 3),
      layout: asString(concept.layout, fallbackConcept.layout),
      premiumFeature: asString(concept.premiumFeature, fallbackConcept.premiumFeature),
      palette,
      mockupImage: createVehicleMockup(fallback.selectedVehicle.id, palette, request.companyName, headline),
      mockupThumbnail: createVehicleMockup(fallback.selectedVehicle.id, palette, request.companyName, title, true),
    };
  });

  return {
    ...fallback,
    concepts,
    gallery: concepts.map((concept) => ({
      id: concept.id,
      title: concept.title,
      description: concept.headline,
      image: concept.mockupThumbnail,
    })),
  };
}

async function readSessions() {
  try {
    const file = await readFile(STORAGE_FILE, 'utf8');
    return JSON.parse(file) as Record<string, StoredWrapSession>;
  } catch {
    return {};
  }
}

async function saveSession(session: StoredWrapSession) {
  try {
    const sessions = await readSessions();
    sessions[session.sessionId] = session;
    await mkdir(STORAGE_DIRECTORY, { recursive: true });
    await writeFile(STORAGE_FILE, JSON.stringify(sessions, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[], limit: number) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim())
    .slice(0, limit);

  return normalized.length === limit ? normalized : fallback;
}

function normalizePalette(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const palette = value
    .filter((entry): entry is string => typeof entry === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(entry))
    .slice(0, 3);

  return palette.length === 3 ? palette : fallback;
}
