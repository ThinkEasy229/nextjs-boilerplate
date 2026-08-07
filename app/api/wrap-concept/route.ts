import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type WrapConceptInput = {
  vehicleType: string;
  designDirection: string;
  companyName: string;
  contactEmail: string;
};

function toTrimmedString(value: FormDataEntryValue | unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function parseInput(request: Request): Promise<WrapConceptInput> {
  const contentType = request.headers.get('content-type') ?? '';

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    const formData = await request.formData();

    return {
      vehicleType: toTrimmedString(formData.get('vehicleType')),
      designDirection: toTrimmedString(formData.get('designDirection')),
      companyName: toTrimmedString(formData.get('companyName')),
      contactEmail: toTrimmedString(formData.get('contactEmail')),
    };
  }

  const body = (await request.json()) as Partial<WrapConceptInput>;

  return {
    vehicleType: toTrimmedString(body.vehicleType),
    designDirection: toTrimmedString(body.designDirection),
    companyName: toTrimmedString(body.companyName),
    contactEmail: toTrimmedString(body.contactEmail),
  };
}

export async function POST(request: Request) {
  let input: WrapConceptInput;

  try {
    input = await parseInput(request);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { vehicleType, designDirection, companyName, contactEmail } = input;

  if (!vehicleType || !designDirection || !companyName || !contactEmail) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        imageUrl: '',
        conceptTitle: `${companyName} ${vehicleType} Wrap Concept`,
        creativeRationale: `Placeholder concept for ${companyName} based on a ${designDirection} direction for a ${vehicleType}.`,
      },
      metadata: {
        vehicleType,
        companyName,
        generatedAt: new Date().toISOString(),
        mock: true,
      },
    },
    { status: 200, headers: CORS_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
