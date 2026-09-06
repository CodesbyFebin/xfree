export const INDEXNOW_KEY = "96aea7e6b8f340b4ba96b60e8e43c0e5";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
export const INDEXNOW_KEY_FILE = `${INDEXNOW_KEY}.txt`;

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

export function buildIndexNowPayload(host: string, urlList: string[]): IndexNowPayload {
  const cleanHost = new URL(host).hostname;
  return {
    host: cleanHost,
    key: INDEXNOW_KEY,
    keyLocation: `https://${cleanHost}/${INDEXNOW_KEY_FILE}`,
    urlList,
  };
}

export async function submitIndexNow(payload: IndexNowPayload): Promise<{ status: number; body: string }> {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  return { status: response.status, body: text };
}
