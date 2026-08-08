import type {
  PremiumPackage,
  SalesContact,
  VehicleOption,
  WrapDesignRequest,
  WrapDesignSessionData,
  WrapVehicleSpecs,
} from '@/lib/wrap-designer';
import { validateWrapDesignRequest } from '@/lib/wrap-designer';

export type WrapConceptParams = WrapDesignRequest;

export interface WrapConceptBootstrapResponse {
  success: true;
  data: {
    availableVehicles: VehicleOption[];
    premiumPackage: PremiumPackage;
    contact: SalesContact;
  };
}

export interface WrapConceptResponse {
  success: true;
  data: WrapDesignSessionData;
  metadata: {
    generatedAt: string;
    imageUrlExpiresAt: string;
    source: 'ai';
    stored: boolean;
    vehicle: WrapVehicleSpecs;
  };
}

export interface WrapConceptError {
  error: string;
}

export async function fetchWrapDesignerBootstrap(
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || ''
): Promise<WrapConceptBootstrapResponse> {
  const endpoint = resolveWrapConceptEndpoint(apiUrl);
  const response = await fetch(endpoint, { method: 'GET' });
  const data = await readResponseJson<WrapConceptBootstrapResponse | WrapConceptError>(response);

  if (!response.ok) {
    const errorMessage =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Unknown error occurred';
    throw new Error(`API Error (${response.status}): ${errorMessage}`);
  }

  if (!data) {
    throw new Error('API Error: Missing JSON response body');
  }

  if (!('success' in data) || !data.success) {
    throw new Error('API Error: Invalid bootstrap response');
  }

  return data;
}

export async function generateWrapConcept(
  params: WrapConceptParams,
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || ''
): Promise<WrapConceptResponse> {
  const endpoint = resolveWrapConceptEndpoint(apiUrl);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const data = await readResponseJson<WrapConceptResponse | WrapConceptError>(response);

  if (!response.ok) {
    const errorMessage =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Unknown error occurred';
    throw new Error(`API Error (${response.status}): ${errorMessage}`);
  }

  if (!data) {
    throw new Error('API Error: Missing JSON response body');
  }

  if (!('success' in data) || !data.success) {
    throw new Error('API Error: Invalid wrap concept response');
  }

  return data;
}

export { validateWrapDesignRequest as validateWrapConceptParams };

function resolveWrapConceptEndpoint(apiUrl: string) {
  if (apiUrl) {
    return new URL('/api/wrap-concept', apiUrl).toString();
  }

  if (typeof window !== 'undefined') {
    return '/api/wrap-concept';
  }

  throw new Error('API URL not configured');
}

async function readResponseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (!response.ok) {
      return { error: text } as T;
    }

    throw new Error('API Error: Invalid JSON response body');
  }
}
