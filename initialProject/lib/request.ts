import { string } from 'prop-types';

export const apiPostRequest = async <Response = any>(url: string, payload: any) => {
  const TIMEOUT_MS = 10000;
  const controller = new AbortController();
  const timeoutTimerID = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    if (e?.message == 'The user aborted a request.') return { status: 'timeout' as const };
    return { status: 'request failed' as const, details: e?.message };
  }

  clearTimeout(timeoutTimerID);

  if (response.status != 200) {
    return { status: 'request error' as const, details: 'statusCode' + response.status };
  }

  const data = await response.json();
  if (!data || !data.status) return { status: 'error parsing data' as const };

  return data as Response;
};
