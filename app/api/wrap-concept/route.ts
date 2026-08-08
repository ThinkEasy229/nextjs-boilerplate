import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  createFallbackConcepts,
  getSalesContact,
  getWrapDesignRequestValidationError,
  PREMIUM_PACKAGE,
  VEHICLE_LIBRARY,
  type WrapDesignRequest,
  type WrapDesignSessionData,
  type WrapVehicleSpecs,
  type PremiumPackage,
  type SalesContact,
  type VehicleOption,
} from "@/lib/wrap-designer";

export const runtime = "nodejs";

type WrapConceptBootstrapResponse = {
  success: true;
  data: {
    availableVehicles: VehicleOption[];
    premiumPackage: PremiumPackage;
    contact: SalesContact;
  };
};

type WrapConceptSuccessResponse = {
  success: true;
  data: WrapDesignSessionData;
  metadata: {
    source: "ai";
    generatedAt: string;
    imageUrlExpiresAt: string;
    stored: boolean;
    vehicle: WrapVehicleSpecs;
  };
};

type WrapConceptErrorResponse = {
  success: false;
  error: string;
  details?: string;
};

type WrapConceptResponse =
  | WrapConceptBootstrapResponse
  | WrapConceptSuccessResponse
  | WrapConceptErrorResponse;

type CreativeDirectionPayload = {
  creativeDirectionOne: string;
  creativeDirectionTwo: string;
  creativeDirectionThree: string;
};

function parseAllowedOrigins(): string[] {
  const raw = process.env.FRAMER_ORIGIN ?? "";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[],
  requestOrigin: string
): boolean {
  if (!origin) {
    return true;
  }

  if (origin === requestOrigin) {
    return true;
  }

  if (allowedOrigins.length === 0) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function buildCorsHeaders(
  origin: string | null,
  allowedOrigins: string[],
  requestOrigin: string
): HeadersInit {
  const allowOrigin =
    allowedOrigins.length === 0
      ? "*"
      : origin && isOriginAllowed(origin, allowedOrigins, requestOrigin)
        ? origin
        : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: WrapConceptResponse, status: number, headers: HeadersInit): NextResponse {
  return NextResponse.json(body, { status, headers });
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = normalizeString(value);
  return normalized || undefined;
}

function normalizeRequest(input: WrapDesignRequest): WrapDesignRequest {
  return {
    vehicleType: normalizeString(input.vehicleType),
    vehicleYear: normalizeString(input.vehicleYear),
    vehicleMake: normalizeString(input.vehicleMake),
    vehicleModel: normalizeString(input.vehicleModel),
    companyName: normalizeString(input.companyName),
    contactEmail: normalizeString(input.contactEmail),
    industry: normalizeString(input.industry),
    preferredColors: normalizeString(input.preferredColors),
    designDirection: normalizeString(input.designDirection),
    tagline: normalizeOptionalString(input.tagline),
    goals: normalizeOptionalString(input.goals),
  };
}

function parseCreativeDirectionsJSON(
  raw: string,
  fallback: WrapDesignSessionData
): CreativeDirectionPayload {
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof CreativeDirectionPayload, unknown>>;
    const creativeDirectionOne = normalizeString(parsed.creativeDirectionOne);
    const creativeDirectionTwo = normalizeString(parsed.creativeDirectionTwo);
    const creativeDirectionThree = normalizeString(parsed.creativeDirectionThree);

    if (!creativeDirectionOne || !creativeDirectionTwo || !creativeDirectionThree) {
      return {
        creativeDirectionOne: fallback.creativeDirectionOne,
        creativeDirectionTwo: fallback.creativeDirectionTwo,
        creativeDirectionThree: fallback.creativeDirectionThree,
      };
    }

    return {
      creativeDirectionOne,
      creativeDirectionTwo,
      creativeDirectionThree,
    };
  } catch {
    return {
      creativeDirectionOne: fallback.creativeDirectionOne,
      creativeDirectionTwo: fallback.creativeDirectionTwo,
      creativeDirectionThree: fallback.creativeDirectionThree,
    };
  }
}

function buildErrorResponse(
  error: string,
  headers: HeadersInit,
  status: number,
  details?: string
): NextResponse {
  return json(
    {
      success: false,
      error,
      ...(details ? { details } : {}),
    },
    status,
    headers
  );
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigins = parseAllowedOrigins();
  const headers = buildCorsHeaders(origin, allowedOrigins, req.nextUrl.origin);
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigins = parseAllowedOrigins();
  const headers = buildCorsHeaders(origin, allowedOrigins, req.nextUrl.origin);

  return json(
    {
      success: true,
      data: {
        availableVehicles: VEHICLE_LIBRARY,
        premiumPackage: PREMIUM_PACKAGE,
        contact: getSalesContact(process.env.SALES_EMAIL || process.env.NEXT_PUBLIC_SALES_EMAIL),
      },
    },
    200,
    headers
  );
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigins = parseAllowedOrigins();
  const headers = buildCorsHeaders(origin, allowedOrigins, req.nextUrl.origin);

  if (!isOriginAllowed(origin, allowedOrigins, req.nextUrl.origin)) {
    return buildErrorResponse("Origin not allowed", headers, 403);
  }

  if (!process.env.OPENAI_API_KEY) {
    return buildErrorResponse(
      "Server misconfiguration",
      headers,
      500,
      "Missing OPENAI_API_KEY"
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return buildErrorResponse("Invalid JSON body", headers, 400);
  }

  const validationError = getWrapDesignRequestValidationError(body);
  if (validationError) {
    return buildErrorResponse(validationError, headers, 400);
  }

  const normalizedBody = normalizeRequest(body as WrapDesignRequest);
  const fallbackSession = createFallbackConcepts(
    normalizedBody,
    process.env.SALES_EMAIL || process.env.NEXT_PUBLIC_SALES_EMAIL
  );
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const imagePrompt = [
      `Create a premium, photoreal vehicle wrap concept for a ${normalizedBody.vehicleYear} ${normalizedBody.vehicleMake} ${normalizedBody.vehicleModel} (${normalizedBody.vehicleType}).`,
      `Company: ${normalizedBody.companyName}.`,
      `Industry: ${normalizedBody.industry}.`,
      `Preferred colors: ${normalizedBody.preferredColors}.`,
      `Design direction: ${normalizedBody.designDirection}.`,
      normalizedBody.tagline ? `Tagline: ${normalizedBody.tagline}.` : null,
      normalizedBody.goals ? `Goals: ${normalizedBody.goals}.` : null,
      "Show realistic branding placement, clear roadside readability, professional composition, realistic lighting, no watermark, and no gibberish text.",
    ]
      .filter(Boolean)
      .join(" ");

    const imageResult = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: imagePrompt,
      size: "1024x1024",
    });

    const imageItem = imageResult?.data?.[0];
    const imageUrl =
      (typeof imageItem?.url === "string" && imageItem.url) ||
      (typeof imageItem?.b64_json === "string" && imageItem.b64_json
        ? `data:image/png;base64,${imageItem.b64_json}`
        : null);

    if (!imageUrl) {
      return buildErrorResponse(
        "Image generation failed",
        headers,
        502,
        "No usable image output returned by upstream model"
      );
    }

    const conceptCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4o",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are a senior vehicle wrap creative strategist. Return ONLY valid JSON with keys creativeDirectionOne, creativeDirectionTwo, creativeDirectionThree. Each value must be a concise 2-4 sentence creative direction.",
        },
        {
          role: "user",
          content: [
            `Vehicle: ${normalizedBody.vehicleYear} ${normalizedBody.vehicleMake} ${normalizedBody.vehicleModel} (${normalizedBody.vehicleType})`,
            `Company: ${normalizedBody.companyName}`,
            `Industry: ${normalizedBody.industry}`,
            `Preferred colors: ${normalizedBody.preferredColors}`,
            `Design direction: ${normalizedBody.designDirection}`,
            normalizedBody.tagline ? `Tagline: ${normalizedBody.tagline}` : null,
            normalizedBody.goals ? `Goals: ${normalizedBody.goals}` : null,
            "Write three distinct premium wrap directions that feel purchase-ready and easy for a sales rep to present.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });

    const creativeDirectionPayload = parseCreativeDirectionsJSON(
      conceptCompletion.choices?.[0]?.message?.content ?? "",
      fallbackSession
    );
    const creativeDirections = [
      creativeDirectionPayload.creativeDirectionOne,
      creativeDirectionPayload.creativeDirectionTwo,
      creativeDirectionPayload.creativeDirectionThree,
    ] as [string, string, string];
    const generatedAt = new Date().toISOString();
    const imageUrlExpiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString();

    return json(
      {
        success: true,
        data: {
          ...fallbackSession,
          imageUrl,
          creativeDirectionOne: creativeDirections[0],
          creativeDirectionTwo: creativeDirections[1],
          creativeDirectionThree: creativeDirections[2],
          creativeDirections,
        },
        metadata: {
          source: "ai",
          generatedAt,
          imageUrlExpiresAt,
          stored: false,
          vehicle: fallbackSession.vehicleSpecs,
        },
      },
      200,
      headers
    );
  } catch (err: unknown) {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status?: unknown }).status) || 500
        : 500;

    if (status === 429) {
      return buildErrorResponse(
        "Rate limit exceeded",
        headers,
        429,
        "Please try again shortly."
      );
    }

    return buildErrorResponse(
      "Upstream generation failed",
      headers,
      status >= 400 && status < 600 ? status : 500,
      "Unable to generate wrap concept at this time."
    );
  }
}
