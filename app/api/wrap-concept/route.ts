import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Wrap Concept Generator API is live!',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { vehicleType, designDirection, companyName, contactEmail } = body;

    if (!vehicleType || !designDirection || !companyName || !contactEmail) {
      return NextResponse.json({
        error: 'Missing required fields: vehicleType, designDirection, companyName, contactEmail'
      }, { status: 400, headers });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenAI API key not configured in Vercel environment'
      }, { status: 500, headers });
    }

    let OpenAI;
    try {
      OpenAI = (await import('openai')).default;
    } catch (err) {
      return NextResponse.json({
        error: 'OpenAI SDK not available'
      }, { status: 500, headers });
    }

    const client = new OpenAI({ apiKey });

    const imageResponse = await client.images.generate({
      model: 'dall-e-3',
      prompt: `Professional vehicle wrap design for a ${vehicleType} for ${companyName}. Style: ${designDirection}. Photorealistic.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = imageResponse.data && imageResponse.data.length > 0 ? imageResponse.data[0].url : '';

    if (!imageUrl) {
      return NextResponse.json({
        error: 'Failed to generate image from OpenAI'
      }, { status: 500, headers });
    }

    const textResponse = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{
        role: 'user',
        content: `Create a title and rationale for a ${vehicleType} wrap for ${companyName} with this direction: ${designDirection}. Format as JSON: {"conceptTitle":"...","creativeRationale":"..."}`,
      }],
      max_tokens: 300,
    });

    let conceptData = {
      conceptTitle: `${companyName} ${vehicleType} Wrap`,
      creativeRationale: 'Professional vehicle wrap design concept',
    };

    try {
      const content = textResponse.choices[0]?.message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        conceptData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Use defaults
    }

    return NextResponse.json({
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
      }
    }, { status: 200, headers });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate concept'
    }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
