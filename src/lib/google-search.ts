export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function webSearch(query: string): Promise<string> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("Missing MAKE_WEBHOOK_URL environment variable");
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Make.com webhook error ${res.status}: ${errText}`);
  }

  // Make AI Web Search returns a text response, not structured JSON
  return await res.text();
}
