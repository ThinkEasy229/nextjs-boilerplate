import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type WrapConceptRequest = {
  vehicleType: string;
  designDirection: string;
  companyName: string;
  contactEmail: string;
};

type WrapConceptResponse = {
  success: boolean;
  imageUrl?: string;
  conceptTitle?: string;
  creativeRationale?: string;
  metadata?: {
    vehicleType: string;
    companyName: string;
    generatedAt: string;
  };
  error?: string;
  details?: string;
};

const FIELD_LIMITS = {
  vehicleType: 80,
  designDirection: 800,
  companyName: 120,
  contactEmail: 254,
} as const;

function parseAllowedOrigins(): string[] {
  const raw = process.env.FRAMER_ORIGIN ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string | null, allowed: string[]): boolean {
  if (!origin) return false;
  return allowed.includes(origin);
}

function buildCorsHeaders(origin: string | null, allowed: string[]): HeadersInit {
  const allowOrigin = isOriginAllowed(origin, allowed) ? origin! : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(
  body: WrapConceptResponse,
  status: number,
  headers: HeadersInit
): NextResponse {
  return NextResponse.json(body, { status, headers });
}

function normalizeString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateBody(input: any): { ok: true; value: WrapConceptRequest } | { ok: false; error: string } {
  const vehicleType = normalizeString(input?.vehicleType);
  const designDirection = normalizeString(input?.designDirection);
  const companyName = normalizeString(input?.companyName);
  const contactEmail = normalizeString(input?.contactEmail);

  if (!vehicleType || !designDirection || !companyName || !contactEmail) {
    return {
      ok: false,
      error:
        "Missing required fields: vehicleType, designDirection, companyName, contactEmail",
    };
  }

  if (vehicleType.length > FIELD_LIMITS.vehicleType) {
    return { ok: false, error: `vehicleType exceeds ${FIELD_LIMITS.vehicleType} characters` };
  }
  if (designDirection.length > FIELD_LIMITS.designDirection) {
    return {
      ok: false,
      error: `designDirection exceeds ${FIELD_LIMITS.designDirection} characters`,
    };
  }
  if (companyName.length > FIELD_LIMITS.companyName) {
    return { ok: false, error: `companyName exceeds ${FIELD_LIMITS.companyName} characters` };
  }
  if (contactEmail.length > FIELD_LIMITS.contactEmail) {
    return {
      ok: false,
      error: `contactEmail exceeds ${FIELD_LIMITS.contactEmail} characters`,
    };
  }
  if (!isValidEmail(contactEmail)) {
    return { ok: false, error: "Invalid contactEmail format" };
  }

  return {
    ok: true,
    value: { vehicleType, designDirection, companyName, contactEmail },
  };
}

function safeConceptFallback(vehicleType: string, companyName: string) {
  return {
    conceptTitle: `${companyName} ${vehicleType} Wrap Concept`,
    creativeRationale:
      "A clean, brand-forward wrap concept designed for readability, visual impact, and professional on-road presence.",
  };
}

function parseConceptJSON(raw: string, vehicleType: string, companyName: string) {
  try {
    const parsed = JSON.parse(raw);
    const conceptTitle = normalizeString(parsed?.conceptTitle);
    const creativeRationale = normalizeString(parsed?.creativeRationale);

    if (!conceptTitle || !creativeRationale) {
      return safeConceptFallback(vehicleType, companyName);
    }

    return { conceptTitle, creativeRationale };
  } catch {
    return safeConceptFallback(vehicleType, companyName);
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigins = parseAllowedOrigins();
  const headers = buildCorsHeaders(origin, allowedOrigins);
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigins = parseAllowedOrigins();
  const headers = buildCorsHeaders(origin, allowedOrigins);

  return json(
    {
      success: true,
      details: "wrap-concept endpoint is healthy",
    },
    200,
    headers
  );
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigins = parseAllowedOrigins();
  const headers = buildCorsHeaders(origin, allowedOrigins);

  if (!isOriginAllowed(origin, allowedOrigins)) {
    return json(
      {
        success: false,
        error: "Origin not allowed",
      },
      403,
      headers
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(
      {
        success: false,
        error: "Server misconfiguration",
        details: "Missing OPENAI_API_KEY",
      },
      500,
      headers
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(
      {
        success: false,
        error: "Invalid JSON body",
      },
      400,
      headers
    );
  }

  const validated = validateBody(body);
  if (!validated.ok) {
    return json(
      {
        success: false,
        error: validated.error,
      },
      400,
      headers
    );
  }

  const normalizedBody = validated.value;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const imagePrompt = [
      `Create a professional vehicle wrap concept for a ${normalizedBody.vehicleType}.`,
      `Design direction: ${normalizedBody.designDirection}.`,
      `Brand/company: ${normalizedBody.companyName}.`,
      "Photoreal quality concept render, clean composition, realistic lighting, no watermark, no gibberish text.",
    ].join(" ");

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
      return json(
        {
          success: false,
          error: "Image generation failed",
          details: "No usable image output returned by upstream model",
        },
        502,
        headers
      );
    }

    const conceptCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4o",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are a senior vehicle wrap creative strategist. Return ONLY valid JSON with keys: conceptTitle, creativeRationale.",
        },
        {
          role: "user",
          content: [
            `Vehicle type: ${normalizedBody.vehicleType}`,
            `Company: ${normalizedBody.companyName}`,
            `Design direction: ${normalizedBody.designDirection}`,
            "Write a concise concept title and a persuasive 2-4 sentence rationale.",
          ].join("\n"),
        },
      ],
    });

    const conceptRaw = conceptCompletion.choices?.[0]?.message?.content ?? "";
    const concept = parseConceptJSON(
      conceptRaw,
      normalizedBody.vehicleType,
      normalizedBody.companyName
    );

    return json(
      {
        success: true,
        imageUrl,
        conceptTitle: concept.conceptTitle,
        creativeRationale: concept.creativeRationale,
        metadata: {
          vehicleType: normalizedBody.vehicleType,
          companyName: normalizedBody.companyName,
          generatedAt: new Date().toISOString(),
        },
      },
      200,
      headers
    );
  } catch (err: any) {
    const status = Number(err?.status) || 500;

    if (status === 429) {
      return json(
        {
          success: false,
          error: "Rate limit exceeded",
          details: "Please try again shortly.",
        },
        429,
        headers
      );
    }

    return json(
      {
        success: false,
        error: "Upstream generation failed",
        details: "Unable to generate wrap concept at this time.",
      },
      status >= 400 && status < 600 ? status : 500,
      headers
    );
  }
}
