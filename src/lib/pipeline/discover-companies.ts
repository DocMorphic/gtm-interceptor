import { webSearch } from "@/lib/google-search";
import { geminiJSON } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export interface DiscoveredCompany {
  name: string;
  linkedinUrl: string;
  industry: string;
  employeeCount: string;
  region: string;
  description: string;
  fitScore: number;
  fitReason: string;
}

interface GeminiCompanyExtraction {
  companies: Array<{
    name: string;
    linkedinUrl: string;
    industry: string;
    employeeCount: string;
    region: string;
    description: string;
    fitScore: number;
    fitReason: string;
  }>;
}

// Manex AI's existing clients - must be excluded from prospects
const EXISTING_CLIENTS = [
  "bmw", "audi", "stellantis", "tdk", "tdk electronics",
  "bsh", "bosch siemens", "bsh hausgeräte", "henkel", "osram",
  "manex", "manex ai",
];

function isExistingClient(companyName: string): boolean {
  const lower = companyName.toLowerCase();
  return EXISTING_CLIENTS.some(
    (client) => lower.includes(client) || client.includes(lower)
  );
}

export async function discoverAndScoreCompanies(
  searchQueries: string[]
): Promise<DiscoveredCompany[]> {
  const allCompanies: DiscoveredCompany[] = [];
  const seenUrls = new Set<string>();

  // Check existing companies in DB to avoid duplicates
  const existing = await prisma.company.findMany({
    select: { linkedinUrl: true },
  });
  for (const c of existing) seenUrls.add(c.linkedinUrl);

  for (const query of searchQueries) {
    try {
      const searchText = await webSearch(query);
      if (!searchText || searchText.length < 50) continue;

      // Use Gemini to extract structured company data from search text
      const extracted = await geminiJSON<GeminiCompanyExtraction>(`
You are a B2B sales data analyst for Manex AI GmbH, which sells "Qualitatio" - an AI-powered manufacturing optimization agent for quality management, defect prediction, and process steering.

Their existing clients: BMW, Audi, Stellantis, TDK Electronics, BSH, Henkel, OSRAM.

Extract ALL companies mentioned in this web search result text. For each company, provide structured data.

SEARCH RESULTS:
${searchText}

For each company found, extract:
- name: Company name (exact official name)
- linkedinUrl: Their LinkedIn company page URL. ONLY use a URL if it literally appears in the search results text above. If no URL is present, set this to an empty string "".
- industry: Primary industry (e.g., "Automotive", "Electronics Manufacturing", "Industrial Equipment", "Consumer Goods", "Pharmaceutical", "Aerospace", "Chemical")
- employeeCount: Estimated size ("1-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+")
- region: Geographic region ("DACH", "Western Europe", "Nordics", "Eastern Europe", "Global")
- description: 1-2 sentence description
- fitScore: 0-100, how well they match as a Manex AI prospect. ANY company with manufacturing/production operations scores at least 40. Pure service/consulting companies score lower.
- fitReason: 1 sentence explaining the score

CRITICAL RULES:
- DO NOT invent or guess LinkedIn URLs. Only use URLs that appear verbatim in the search results.
- If no LinkedIn URL is found in the text, set linkedinUrl to ""
- Include ALL companies that have any manufacturing or production operations
- Be generous with fitScore - even a slight connection to manufacturing gets 40+

Return JSON: { "companies": [...] }
If no companies are found, return: {"companies": []}
`);

      for (const company of extracted.companies) {
        if (company.fitScore < 20) continue;
        if (isExistingClient(company.name)) continue;

        // Try to extract a clean LinkedIn URL from what Gemini found
        let finalUrl: string;
        const urlMatch = company.linkedinUrl.match(
          /linkedin\.com\/company\/([^/?#]+)/
        );

        if (urlMatch) {
          // Gemini found a real URL - normalize it
          finalUrl = `https://www.linkedin.com/company/${urlMatch[1]}`;
        } else {
          // No real URL found - construct a LinkedIn search link as fallback
          const slug = company.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          finalUrl = `https://www.linkedin.com/company/${slug}`;
        }

        if (seenUrls.has(finalUrl)) continue;

        seenUrls.add(finalUrl);
        allCompanies.push({ ...company, linkedinUrl: finalUrl });
      }
    } catch (err) {
      console.error(`Search/extract failed for query: ${query}`, err);
    }
  }

  return allCompanies;
}
