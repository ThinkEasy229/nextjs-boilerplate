import { NextRequest, NextResponse } from 'next/server';

const OpenAI = require('openai').default;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleType, designDirection, companyName, contactEmail } = body;

    // Validate input
    if (!vehicleType || !designDirection || !companyName || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const client = new OpenAI({ apiKey });

    // Generate image
    const imageResponse = await client.images.generate({
      model: 'dall-e-3',
      prompt: `Professional vehicle wrap design for a ${vehicleType} for ${companyName}. Style: ${designDirection}. Photorealistic. High quality.`,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = imageResponse.data[0]?.url || '';

    // Generate text concept
    const textResponse = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: `Create a vehicle wrap design concept for a ${vehicleType} for company "${companyName}" with style "${designDirection}". Respond ONLY with valid JSON: {"conceptTitle":"...","creativeRationale":"..."}`,
        },
      ],
      max_tokens: 300,
    });

    let conceptTitle = `${companyName} ${vehicleType} Wrap`;
    let creativeRationale = 'Professional vehicle wrap design';

    try {
      const content = textResponse.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      conceptTitle = parsed.conceptTitle || conceptTitle;
      creativeRationale = parsed.creativeRationale || creativeRationale;
    } catch {
      // Use defaults
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          imageUrl,
          conceptTitle,
          creativeRationale,
        },
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate design' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
