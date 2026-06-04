import { LITCODE_API_BASE_URL } from '../constants';

type ComplexityInput = {
  slug: string;
  code: string;
  language: string;
};

export type ComplexityResult = {
  timeComplexity: string;
  timeExplanation: string;
  spaceComplexity: string;
  spaceExplanation: string;
  confidence: 'Low' | 'Medium' | 'High';
};

type ApiComplexityResponse = {
  success: boolean;
  data?: {
    time?: {
      complexity?: string;
      reason?: string;
    };
    space?: {
      complexity?: string;
      reason?: string;
    };
    confidence?: 'Low' | 'Medium' | 'High';
    note?: string | null;
  };
};

const apiUrl = () => {
  const baseUrl = LITCODE_API_BASE_URL.trim().replace(/\/+$/, '');
  return baseUrl ? `${baseUrl}/analyze-complexity` : '';
};

const fromApiResult = (response: ApiComplexityResponse): ComplexityResult => {
  if (!response.success || !response.data?.time?.complexity || !response.data?.space?.complexity) {
    throw new Error('Complexity API returned an incomplete response');
  }

  return {
    timeComplexity: response.data.time.complexity,
    timeExplanation: response.data.time.reason || 'No explanation provided.',
    spaceComplexity: response.data.space.complexity,
    spaceExplanation: response.data.space.reason || 'No explanation provided.',
    confidence: response.data.confidence || 'Medium',
  };
};

export const analyzeComplexityWithApi = async (input: ComplexityInput): Promise<ComplexityResult> => {
  const endpoint = apiUrl();
  if (!endpoint) {
    return {
      timeComplexity: 'Unknown',
      timeExplanation: 'API URL is not configured.',
      spaceComplexity: 'Unknown',
      spaceExplanation: 'API URL is not configured.',
      confidence: 'Low',
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: input.code }),
    });

    if (!response.ok) {
      throw new Error(`Complexity API failed with status ${response.status}`);
    }

    return fromApiResult((await response.json()) as ApiComplexityResponse);
  } catch (error) {
    console.warn('LitCode: failed to get complexity from API', error);
    return {
      timeComplexity: 'Unknown',
      timeExplanation: 'Complexity analysis failed or timed out.',
      spaceComplexity: 'Unknown',
      spaceExplanation: 'Complexity analysis failed or timed out.',
      confidence: 'Low',
    };
  }
};
