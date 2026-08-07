import { NextRequest, NextResponse } from 'next/server';

// CORS headers for Framer integration
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

// Handle GET requests - simple test endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'active',
      message: 'Vehicle Wrap Concept Generator API',
      version: '1.0',
      endpoint: '/api/wrap-concept',
      usage: {
        method: 'POST',
        url: '/api/wrap-concept',
        body: {
          vehicleType: 'van',
          designDirection: 'Modern minimalist design',
          companyName: 'Your Company',
          contactEmail: 'email@example.com',
          revisionNotes: 'Optional feedback'
        }
      },
      timestamp: new Date().toISOString(),
    },
    { 
      status: 200,
      headers: getCorsHeaders()
    }
  );
}

// Handle POST requests - generate wrap concepts
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const { vehicleType, designDirection, companyName, contactEmail } = body;
    
    if (!vehicleType || !designDirection || !companyName || !contactEmail) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['vehicleType', 'designDirection', 'companyName', 'contactEmail']
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          message: 'Please configure OPENAI_API_KEY in Vercel environment variables'
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Import OpenAI dynamically to avoid build issues
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    // Build prompts
    const revisionContext = body.revisionNotes 
      ? `\n\nRevision feedback: ${body.revisionNotes}`
      : '';

    const imagePrompt = `Create a professional vehicle wrap design concept for a ${vehicleType} for ${companyName}.
Design direction: ${designDirection}${revisionContext}

The design should be visually striking, brand-appropriate, photorealistic, and ready for production.`;

    const textPrompt = `Given this vehicle wrap request:
- Vehicle: ${vehicleType}
- Company: ${companyName}
- Design Direction: ${designDirection}
${body.revisionNotes ? `- Revision Notes: ${body.revisionNotes}` : ''}

Provide:
1. A concise concept title (max 10 words)
2. A brief creative rationale (max 100 words)

Respond ONLY with valid JSON: {"conceptTitle": "...", "creativeRationale": "..."}`;

    // Generate image using DALL-E
    const imageResponse = await client.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = imageResponse.data[0]?.url;
    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }

    // Generate text using GPT-4
    const textResponse = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: textPrompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    const textContent = textResponse.choices[0]?.message.content;
    if (!textContent) {
      throw new Error('Failed to generate text');
    }

    // Parse JSON response
    let conceptData;
    try {
      conceptData = JSON.parse(textContent);
    } catch {
      conceptData = {
        conceptTitle: `${companyName} ${vehicleType} Wrap Concept`,
        creativeRationale: 'Professional vehicle wrap design based on your specifications.',
      };
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          imageUrl,
          conceptTitle: conceptData.conceptTitle,
          creativeRationale: conceptData.creativeRationale,
        },
        metadata: {
          vehicleType,
          companyName,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Wrap concept error:', error);
    
    let errorMessage = 'Failed to generate wrap concept';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('401') || error.message.includes('authentication')) {
        errorMessage = 'Invalid OpenAI API key';
        statusCode = 401;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode, headers: getCorsHeaders() }
    );
  }
}

// Handle OPTIONS (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}
