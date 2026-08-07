import type {
  PremiumPackage,
  SalesContact,
  VehicleOption,
  WrapDesignRequest,
  WrapDesignSessionData,
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
    source: 'ai' | 'fallback';
    stored: boolean;
  };
}

export interface WrapConceptError {
  error: string;
}

export async function fetchWrapDesignerBootstrap(
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || ''
): Promise<WrapConceptBootstrapResponse> {
  const endpoint = `${apiUrl}/api/wrap-concept`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = (await response.json()) as WrapConceptBootstrapResponse | WrapConceptError;

  if (!response.ok) {
    const errorMessage = 'error' in data ? data.error : 'Unknown error occurred';
    throw new Error(`API Error (${response.status}): ${errorMessage}`);
  }

  return data as WrapConceptBootstrapResponse;
}

export async function generateWrapConcept(
  params: WrapConceptParams,
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || ''
): Promise<WrapConceptResponse> {
  const endpoint = `${apiUrl}/api/wrap-concept`;

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
}

export { validateWrapDesignRequest as validateWrapConceptParams };
