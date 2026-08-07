import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Wrap Concept API is alive and deployed!',
      endpoint: '/api/wrap-concept',
      methods: ['POST', 'OPTIONS'],
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured in Vercel environment' },
        { status: 500, headers: corsHeaders }
      );
    }

    // For now, return success to verify endpoint is working
    // Full implementation will use the OpenAI SDK
    const body = await request.json();
    
    return NextResponse.json(
      {
        success: true,
        message: 'Wrap concept endpoint is deployed and working!',
        received: body,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  return new NextResponse(null, { headers: corsHeaders, status: 204 });
}
