/**
 * Client library for calling the vehicle wrap concept API
 * Use this from your Framer site or any frontend
 */

export interface WrapConceptParams {
  vehicleType: string;
  designDirection: string;
  companyName: string;
  contactEmail: string;
  revisionNotes?: string;
}

export interface WrapConceptResponse {
  success: boolean;
  data: {
    imageUrl: string;
    conceptTitle: string;
    creativRationale: string;
  };
  metadata: {
    vehicleType: string;
    companyName: string;
    generatedAt: string;
  };
}

export interface WrapConceptError {
  error: string;
}

/**
 * Generate a vehicle wrap concept
 * @param params - Wrap concept parameters
 * @param apiUrl - Base URL of the API (e.g., https://your-domain.com)
 * @returns Wrap concept response with image URL and details
 */
export async function generateWrapConcept(
  params: WrapConceptParams,
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || ''
): Promise<WrapConceptResponse> {
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }

  const endpoint = `${apiUrl}/api/wrap-concept`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = (await response.json()) as WrapConceptResponse | WrapConceptError;

    if (!response.ok) {
      const errorMessage = 'error' in data ? data.error : 'Unknown error occurred';
      throw new Error(`API Error (${response.status}): ${errorMessage}`);
    }

    return data as WrapConceptResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate wrap concept');
  }
}

/**
 * Validate wrap concept parameters before sending to API
 */
export function validateWrapConceptParams(params: unknown): params is WrapConceptParams {
  if (!params || typeof params !== 'object') return false;

  const p = params as Record<string, unknown>;

  return (
    typeof p.vehicleType === 'string' &&
    p.vehicleType.trim().length > 0 &&
    typeof p.designDirection === 'string' &&
    p.designDirection.trim().length > 0 &&
    typeof p.companyName === 'string' &&
    p.companyName.trim().length > 0 &&
    typeof p.contactEmail === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail)
  );
}
