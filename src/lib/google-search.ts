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

  // Make AI Web Search is an LLM that summarizes web results. 
  // We must explicitly command it NOT to truncate URLs with ellipses (...),
  // otherwise our Regex parser will extract broken 404 links.
  const enhancedQuery = `${query}

CRITICAL: Return a list of the companies found. You MUST print the EXACT, FULL, UNTRUNCATED https://www.linkedin.com/company/... URL for each company. DO NOT shorten or truncate the URLs with ellipses.`;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: enhancedQuery }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Make.com webhook error ${res.status}: ${errText}`);
  }

  // Make AI Web Search returns a text response, not structured JSON
  return await res.text();
}
