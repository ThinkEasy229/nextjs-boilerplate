import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Validate environment variables
const validateEnvironment = (): string => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured in environment');
  }
  return apiKey;
};

// Input validation schema
interface WrapConceptRequest {
  vehicleType: string;
  designDirection: string;
  companyName: string;
  contactEmail: string;
  revisionNotes?: string;
}

// Validate request payload
const validateInput = (data: unknown): WrapConceptRequest => {
  if (!data || typeof data !== 'object') {
    throw new Error('Request body must be a valid JSON object');
  }

  const payload = data as Record<string, unknown>;

  const vehicleType = payload.vehicleType;
  const designDirection = payload.designDirection;
  const companyName = payload.companyName;
  const contactEmail = payload.contactEmail;
  const revisionNotes = payload.revisionNotes;

  // Validate required fields
  if (typeof vehicleType !== 'string' || vehicleType.trim().length === 0) {
    throw new Error('vehicleType is required and must be a non-empty string');
  }

  if (typeof designDirection !== 'string' || designDirection.trim().length === 0) {
    throw new Error('designDirection is required and must be a non-empty string');
  }

  if (typeof companyName !== 'string' || companyName.trim().length === 0) {
    throw new Error('companyName is required and must be a non-empty string');
  }

  if (typeof contactEmail !== 'string' || !isValidEmail(contactEmail)) {
    throw new Error('contactEmail is required and must be a valid email address');
  }

  // Validate string lengths to prevent abuse
  if (vehicleType.length > 100) {
    throw new Error('vehicleType must be 100 characters or less');
  }

  if (designDirection.length > 500) {
    throw new Error('designDirection must be 500 characters or less');
  }

  if (companyName.length > 200) {
    throw new Error('companyName must be 200 characters or less');
  }

  if (revisionNotes && typeof revisionNotes === 'string' && revisionNotes.length > 500) {
    throw new Error('revisionNotes must be 500 characters or less');
  }

  return {
    vehicleType: vehicleType.trim(),
    designDirection: designDirection.trim(),
    companyName: companyName.trim(),
    contactEmail: contactEmail.trim(),
    revisionNotes: revisionNotes && typeof revisionNotes === 'string' ? revisionNotes.trim() : undefined,
  };
};

// Simple email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Extract JSON from text response (handles markdown code blocks)
const extractJSON = (text: string): Record<string, unknown> => {
  try {
    // Try direct JSON parsing first
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        throw new Error('Invalid JSON in response');
      }
    }
    throw new Error('No valid JSON found in response');
  }
};

// Generate wrap concept using OpenAI
const generateWrapConcept = async (
  apiKey: string,
  request: WrapConceptRequest
): Promise<{
  imageUrl: string;
  conceptTitle: string;
  creativeRationale: string;
}> => {
  const client = new OpenAI({ apiKey });

  // Build creative prompt for DALL-E
  const revisionContext = request.revisionNotes
    ? `\n\nIncorporate feedback: ${request.revisionNotes}`
    : '';

  const imagePrompt = `Create a professional vehicle wrap design concept for a ${request.vehicleType} for ${request.companyName}. 
Design direction: ${request.designDirection}${revisionContext}

The design should be visually striking, brand-appropriate, and ready for production. Photorealistic rendering of the vehicle with the wrap applied.`;

  try {
    // Generate image using DALL-E 3
    const imageResponse = await client.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = imageResponse.data[0]?.url;
    if (!imageUrl) {
      throw new Error('Failed to generate image from OpenAI');
    }

    // Generate concept title and rationale using GPT-4
    const textResponse = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: `Given this vehicle wrap request:
- Vehicle: ${request.vehicleType}
- Company: ${request.companyName}
- Design Direction: ${request.designDirection}
${request.revisionNotes ? `- Revision Notes: ${request.revisionNotes}` : ''}

Please provide:
1. A concise concept title (max 10 words)
2. A brief creative rationale (max 100 words)

Format your response as valid JSON with keys: "conceptTitle" and "creativeRationale"`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const textContent = textResponse.choices[0]?.message.content;
    if (!textContent) {
      throw new Error('Failed to generate concept text from OpenAI');
    }

    // Parse JSON response with better error handling
    let conceptData: Record<string, unknown>;
    try {
      conceptData = extractJSON(textContent);
    } catch {
      // Fallback if JSON parsing fails
      conceptData = {
        conceptTitle: `${request.companyName} ${request.vehicleType} Wrap`,
        creativeRationale: 'Custom vehicle wrap design concept based on your specifications.',
      };
    }

    return {
      imageUrl,
      conceptTitle: String(conceptData.conceptTitle || `${request.companyName} Wrap Design`),
      creativeRationale: String(conceptData.creativeRationale || 'Professional vehicle wrap design concept.'),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error during wrap concept generation');
  }
};

// Main API route handler
export async function POST(request: NextRequest) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRAMER_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Validate environment
    const apiKey = validateEnvironment();

    // Parse and validate request body
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validatedInput = validateInput(payload);

    // Generate wrap concept
    const concept = await generateWrapConcept(apiKey, validatedInput);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          imageUrl: concept.imageUrl,
          conceptTitle: concept.conceptTitle,
          creativeRationale: concept.creativeRationale,
        },
        metadata: {
          vehicleType: validatedInput.vehicleType,
          companyName: validatedInput.companyName,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    // Handle OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429, headers: corsHeaders }
        );
      }
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before trying again.' },
          { status: 429, headers: corsHeaders }
        );
      }
      if (error.message.includes('401') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your configuration.' },
          { status: 401, headers: corsHeaders }
        );
      }
      if (error.message.includes('OpenAI')) {
        return NextResponse.json(
          { error: 'External service error. Please try again later.' },
          { status: 503, headers: corsHeaders }
        );
      }
      if (error.message.includes('is required') || error.message.includes('must be')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    console.error('Wrap concept generation error:', error);

    return NextResponse.json(
      { error: 'Failed to generate wrap concept. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Enable CORS for OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRAMER_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return new NextResponse(null, { headers: corsHeaders, status: 204 });
}
