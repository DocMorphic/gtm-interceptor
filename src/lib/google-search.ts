export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface CSEResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
}

export async function googleSearch(
  query: string,
  numResults: number = 10
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    throw new Error("Missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_ID");
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cseId);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(Math.min(numResults, 10)));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google CSE error ${res.status}: ${errText}`);
  }

  const data: CSEResponse = await res.json();
  return (data.items ?? []).map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }));
}
