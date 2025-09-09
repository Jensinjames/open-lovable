import { appConfig } from '@/config/app.config';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(
  url: string | URL | Request,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const {
    maxRetries = appConfig.api.maxRetries,
    retryDelay = appConfig.api.retryDelay,
    timeout = appConfig.api.requestTimeout
  } = retryOptions || {};

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Log retry attempt
      console.warn(`[fetchWithRetry] Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms:`, error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // If all retries failed, throw the last error
  throw new Error(`Fetch failed after ${maxRetries + 1} attempts: ${lastError.message}`);
}