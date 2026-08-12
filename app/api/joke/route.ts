import { NextRequest, NextResponse } from 'next/server';

const JOKE_API_BASE_URL = 'https://v2.jokeapi.dev/joke';
const REQUEST_TIMEOUT_MS = 5000;

// Intentionally scoped to categories exposed by the `type` query param.
type JokeCategory = 'Any' | 'Programming';
type ResponseFormat = 'structured' | 'single';

type SingleJoke = {
  error: false;
  type: 'single';
  category: string;
  joke: string;
};

type TwoPartJoke = {
  error: false;
  type: 'twopart';
  category: string;
  setup: string;
  delivery: string;
};

type JokeApiResponse = SingleJoke | TwoPartJoke;

const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.FRAMER_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

const errorResponse = (status: number, code: string, message: string) =>
  NextResponse.json(
    {
      success: false,
      error: { code, message },
      metadata: { generatedAt: new Date().toISOString() },
    },
    { status, headers: getCorsHeaders() }
  );

const parseType = (value: string | null): JokeCategory => {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue || normalizedValue === 'general' || normalizedValue === 'any') {
    return 'Any';
  }

  if (normalizedValue === 'programming') {
    return 'Programming';
  }

  throw new Error("Invalid 'type' query parameter. Supported values: general, programming.");
};

const parseFormat = (value: string | null): ResponseFormat => {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue || normalizedValue === 'structured' || normalizedValue === 'json') {
    return 'structured';
  }

  if (normalizedValue === 'single') {
    return 'single';
  }

  throw new Error("Invalid 'format' query parameter. Supported values: structured, single.");
};

const isValidJokeApiResponse = (payload: unknown): payload is JokeApiResponse => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<JokeApiResponse> & { error?: boolean };
  if (candidate.error !== false || typeof candidate.category !== 'string') {
    return false;
  }

  if (candidate.type === 'single') {
    return typeof candidate.joke === 'string';
  }

  if (candidate.type === 'twopart') {
    return typeof candidate.setup === 'string' && typeof candidate.delivery === 'string';
  }

  return false;
};

const fetchJoke = async (category: JokeCategory): Promise<JokeApiResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${JOKE_API_BASE_URL}/${category}?safe-mode`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('JOKE_API_REQUEST_FAILED');
    }

    const payload: unknown = await response.json();

    if (!isValidJokeApiResponse(payload)) {
      throw new Error('JOKE_API_INVALID_RESPONSE');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('JOKE_API_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function GET(request: NextRequest) {
  let category: JokeCategory;
  let format: ResponseFormat;

  try {
    category = parseType(request.nextUrl.searchParams.get('type'));
    format = parseFormat(request.nextUrl.searchParams.get('format'));
  } catch (error) {
    return errorResponse(400, 'INVALID_QUERY', error instanceof Error ? error.message : 'Invalid query');
  }

  try {
    const joke = await fetchJoke(category);
    const generatedAt = new Date().toISOString();

    const data =
      format === 'single'
        ? {
            type: 'single',
            joke: joke.type === 'single' ? joke.joke : `${joke.setup}\n${joke.delivery}`,
          }
        : joke.type === 'single'
          ? {
              type: 'single',
              joke: joke.joke,
            }
          : {
              type: 'twopart',
              setup: joke.setup,
              delivery: joke.delivery,
            };

    return NextResponse.json(
      {
        success: true,
        data,
        metadata: {
          source: 'JokeAPI',
          category: joke.category,
          format,
          generatedAt,
        },
      },
      { status: 200, headers: getCorsHeaders() }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'JOKE_API_TIMEOUT') {
        return errorResponse(504, 'TIMEOUT', 'Joke provider timed out. Please try again.');
      }

      if (error.message === 'JOKE_API_INVALID_RESPONSE') {
        return errorResponse(502, 'INVALID_RESPONSE', 'Joke provider returned an invalid response.');
      }
    }

    return errorResponse(502, 'UPSTREAM_FAILURE', 'Unable to fetch a joke from the external provider.');
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders() });
}
