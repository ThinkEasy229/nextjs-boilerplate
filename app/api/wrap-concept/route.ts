import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
} from 'openai';
import {
  getVehicleOption,
  getVehicleSpecs,
  getWrapDesignRequestValidationError,
  getSalesContact,
  PREMIUM_PACKAGE,
  VEHICLE_LIBRARY,
  type WrapDesignRequest,
  type WrapDesignSessionData,
} from '@/lib/wrap-designer';

export const runtime = 'nodejs';

const STORAGE_DIRECTORY = path.join(os.tmpdir(), 'wrap-designer');
const SESSIONS_DIRECTORY = path.join(STORAGE_DIRECTORY, 'sessions');
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WRAP_IMAGE_MODEL = 'gpt-image-1';

interface StoredWrapSession {
  sessionId: string;
  generatedAt: string;
  imageUrlExpiresAt: string;
  source: 'ai';
  data: WrapDesignSessionData;
}

class ImageGenerationError extends Error {}

function getCorsHeaders(request?: NextRequest) {
  const origin = process.env.FRAMER_ORIGIN || request?.headers.get('origin') || request?.nextUrl.origin || 'http://localhost:3000';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function GET(request: NextRequest) {
  const headers = getCorsHeaders(request);
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  try {
    if (sessionId) {
      if (!SESSION_ID_PATTERN.test(sessionId)) {
        return NextResponse.json({ error: 'Invalid design session id' }, { status: 400, headers });
      }

      const stored = await readSession(sessionId);

      if (!stored) {
        return NextResponse.json({ error: 'Design session not found' }, { status: 404, headers });
      }

      if (Date.now() >= Date.parse(stored.imageUrlExpiresAt)) {
        return NextResponse.json(
          { error: 'Stored wrap image URL has expired. Please generate a new wrap preview.' },
          { status: 410, headers }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: stored.data,
          metadata: {
            generatedAt: stored.generatedAt,
            imageUrlExpiresAt: stored.imageUrlExpiresAt,
            source: stored.source,
            stored: true,
            vehicle: stored.data.vehicleSpecs,
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
  const headers = getCorsHeaders(request);

  try {
    const body = (await request.json()) as WrapDesignRequest;
    const validationError = getWrapDesignRequestValidationError(body);

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400, headers }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server.' },
        { status: 500, headers }
      );
    }

    const configuredSalesEmail = process.env.SALES_EMAIL || process.env.NEXT_PUBLIC_SALES_EMAIL;
    const generatedAt = new Date().toISOString();
    const imageUrlExpiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString();
    const data = await generateAiConcepts(body, configuredSalesEmail);

    const sessionId = randomUUID();
    const storedSession: StoredWrapSession = {
      sessionId,
      generatedAt,
      imageUrlExpiresAt,
      source: 'ai',
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
          imageUrlExpiresAt,
          source: 'ai',
          stored,
          vehicle: storedSession.data.vehicleSpecs,
        },
      },
      { headers }
    );
  } catch (error) {
    const { message, status } = getApiErrorResponse(error);

    return NextResponse.json(
      { error: message },
      { status, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

async function generateAiConcepts(
  request: WrapDesignRequest,
  configuredSalesEmail?: string
): Promise<WrapDesignSessionData> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const selectedVehicle = getVehicleOption(request.vehicleType);
  const contact = getSalesContact(configuredSalesEmail);
  const creativeDirections = await generateCreativeDirections(client, request);
  const imagePrompt = buildVehicleWrapImagePrompt(request, selectedVehicle.label, creativeDirections[0]);
  const imageResponse = await client.images.generate({
    model: WRAP_IMAGE_MODEL,
    prompt: imagePrompt,
  });
  const imageUrl = getDisplayableImageUrl(imageResponse);

  if (!imageUrl) {
    throw new ImageGenerationError(
      `OpenAI image generation failed: ${WRAP_IMAGE_MODEL} did not return a displayable image.`
    );
  }

  return {
    sessionId: '',
    selectedVehicle,
    vehicleSpecs: getVehicleSpecs(request),
    imageUrl,
    creativeDirectionOne: creativeDirections[0],
    creativeDirectionTwo: creativeDirections[1],
    creativeDirectionThree: creativeDirections[2],
    creativeDirections,
    premiumPackage: PREMIUM_PACKAGE,
    contact,
  };
}

async function saveSession(session: StoredWrapSession) {
  try {
    await mkdir(SESSIONS_DIRECTORY, { recursive: true });
    await writeFile(getSessionFilePath(session.sessionId), JSON.stringify(session, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

async function readSession(sessionId: string) {
  try {
    const file = await readFile(getSessionFilePath(sessionId), 'utf8');
    return JSON.parse(file) as StoredWrapSession;
  } catch {
    return null;
  }
}

async function generateCreativeDirections(client: OpenAI, request: WrapDesignRequest) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You create premium vehicle wrap creative directions. Return valid JSON with exactly three distinct fields named creativeDirectionOne, creativeDirectionTwo, and creativeDirectionThree. Each value must be 2-3 sentences describing a unique visual approach for the specified vehicle wrap.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          vehicleYear: request.vehicleYear,
          vehicleMake: request.vehicleMake,
          vehicleModel: request.vehicleModel,
          vehicleType: request.vehicleType,
          companyName: request.companyName,
          industry: request.industry,
          preferredColors: request.preferredColors,
          designDirection: request.designDirection,
          tagline: request.tagline || '',
          goals: request.goals || '',
        }),
      },
    ],
    max_tokens: 700,
  });

  const content = response.choices[0]?.message.content;

  if (!content) {
    throw new Error('OpenAI did not return creative directions.');
  }

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error('OpenAI returned creative directions in an unexpected format.');
  }

  const creativeDirectionOne = asRequiredString(parsed.creativeDirectionOne, 'creativeDirectionOne');
  const creativeDirectionTwo = asRequiredString(parsed.creativeDirectionTwo, 'creativeDirectionTwo');
  const creativeDirectionThree = asRequiredString(parsed.creativeDirectionThree, 'creativeDirectionThree');

  return [creativeDirectionOne, creativeDirectionTwo, creativeDirectionThree] as [string, string, string];
}

function buildVehicleWrapImagePrompt(
  request: WrapDesignRequest,
  vehicleLabel: string,
  primaryCreativeDirection: string
) {
  const vehicleDescriptor = `${request.vehicleYear.trim()} ${request.vehicleMake.trim()} ${request.vehicleModel.trim()} ${vehicleLabel}`.trim();

  return [
    'Create a photorealistic commercial vehicle wrap concept render.',
    `Vehicle: ${vehicleDescriptor}.`,
    `Company branding: ${request.companyName.trim()} in the ${request.industry.trim()} industry.`,
    `Preferred brand colors: ${request.preferredColors.trim()}.`,
    `Design vision: ${request.designDirection.trim()}.`,
    `Primary creative direction: ${primaryCreativeDirection}.`,
    request.tagline?.trim() ? `Include this tagline naturally in the design: ${request.tagline.trim()}.` : '',
    request.goals?.trim() ? `Business goal: ${request.goals.trim()}.` : '',
    'Show the full wrapped vehicle in a clean studio setting with premium lighting, realistic proportions, sharp wrap graphics, and no people, watermarks, or extra vehicles.',
    'Prioritize realistic vehicle geometry and a believable production-ready wrap presentation.',
  ]
    .filter(Boolean)
    .join(' ');
}

function asRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`OpenAI did not return a usable ${fieldName} value.`);
  }

  return value.trim();
}

function getDisplayableImageUrl(imageResponse: {
  data?: Array<{ url?: string | null; b64_json?: string | null }>;
}) {
  const generatedImage = imageResponse.data?.[0];
  const imageUrl = generatedImage?.url?.trim();

  if (imageUrl) {
    return imageUrl;
  }

  const imageBase64 = generatedImage?.b64_json?.trim();

  if (!imageBase64) {
    return '';
  }

  return `data:image/png;base64,${imageBase64}`;
}

function getApiErrorResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return {
      status: 429,
      message: 'OpenAI rate limit reached while generating the wrap. Please retry in a few minutes.',
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      status: 500,
      message: 'OpenAI authentication failed. Verify the server OPENAI_API_KEY configuration.',
    };
  }

  if (error instanceof PermissionDeniedError) {
    return {
      status: 500,
      message: 'OpenAI rejected this request. Verify the API key has permission to use text and image generation.',
    };
  }

  if (error instanceof APIConnectionError || error instanceof APIConnectionTimeoutError) {
    return {
      status: 503,
      message: 'OpenAI could not be reached while generating the wrap. Please try again shortly.',
    };
  }

  if (error instanceof ImageGenerationError) {
    return {
      status: 502,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : 'Failed to generate wrap concepts.',
  };
}

function getSessionFilePath(sessionId: string) {
  const fileId = createHash('sha256').update(sessionId).digest('hex');
  return path.join(SESSIONS_DIRECTORY, `${fileId}.json`);
}
