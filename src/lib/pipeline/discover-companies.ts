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

interface GeminiEnrichment {
  companies: Array<{
    linkedinUrl: string;
    name: string;
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

/**
 * Send discovered LinkedIn URLs + search context to Gemini
 * to get real company details: region, industry, employee count, fit score.
 */
async function enrichCompanies(
  rawCompanies: { name: string; linkedinUrl: string }[],
  searchContext: string
): Promise<GeminiEnrichment["companies"]> {
  const companyList = rawCompanies
    .map((c) => `- ${c.name} (${c.linkedinUrl})`)
    .join("\n");

  const result = await geminiJSON<GeminiEnrichment>(`
You are a B2B sales researcher for Manex AI GmbH, which sells "Qualitatio" — an AI-powered manufacturing optimization agent.

Using the search results below AND your own knowledge, enrich each company with accurate details.

COMPANIES TO ENRICH:
${companyList}

SEARCH CONTEXT:
${searchContext}

For EACH company, provide:
- linkedinUrl: Keep exactly as given above
- name: The company's proper official name (fix capitalization, e.g. "Bmw Group" → "BMW Group")
- industry: Specific industry (e.g. "Automotive Parts Manufacturing", "Industrial Electronics", "Precision Engineering"). NOT just "Manufacturing".
- employeeCount: Approximate range (e.g. "1,000-5,000", "50-200", "10,000+"). Use your knowledge. If truly unknown, say "Unknown".
- region: The company's HQ location as "City, Country" (e.g. "Munich, Germany", "Vienna, Austria", "Shanghai, China"). Be specific — use your knowledge of these companies. NEVER say "Unknown" — at minimum provide the country.
- description: 1-2 sentences about what they manufacture/do.
- fitScore: 0-100 score for how well Qualitatio (AI manufacturing quality optimization) fits them:
  - 90-100: Large manufacturer with complex production, quality-critical processes (automotive, aerospace, electronics)
  - 70-89: Mid-size manufacturer or relevant industry
  - 50-69: Small manufacturer or loosely related
  - <50: Not a good fit
- fitReason: 1 sentence explaining the score

CRITICAL RULES:
- Be PRECISE with regions. "Germany" alone is not enough — say "Stuttgart, Germany" or "Hamburg, Germany".
- Be PRECISE with employee counts. Use your knowledge of these companies.
- Be PRECISE with industry. "Manufacturing" alone is too vague — say what KIND of manufacturing.
- Do NOT make up data you are unsure about. Use reasonable estimates based on the company name, URL slug, and search context.

Return JSON: { "companies": [...] }
`);

  return result.companies || [];
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

      // Extract all LinkedIn company URLs from the search results
      const urlRegex = /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+/gi;
      const foundUrls = searchText.match(urlRegex) || [];

      const rawBatch: { name: string; linkedinUrl: string }[] = [];

      for (const url of foundUrls) {
        const finalUrl = url.toLowerCase().replace(/\/$/, "");
        if (seenUrls.has(finalUrl)) continue;

        const slugMatch = finalUrl.match(/company\/([^/]+)/);
        if (!slugMatch) continue;

        let name = slugMatch[1].replace(/-/g, " ");
        name = name.replace(/\b\w/g, (char) => char.toUpperCase());

        if (isExistingClient(name)) continue;

        rawBatch.push({ name, linkedinUrl: finalUrl });
        seenUrls.add(finalUrl);
      }

      if (rawBatch.length === 0) continue;

      // Enrich the batch with Gemini — get real regions, industries, fit scores
      console.log(`[Discovery] Enriching ${rawBatch.length} companies from query...`);
      const enriched = await enrichCompanies(rawBatch, searchText);

      for (const company of enriched) {
        const normalizedUrl = company.linkedinUrl?.toLowerCase().replace(/\/$/, "");
        if (!normalizedUrl) continue;
        if (isExistingClient(company.name)) continue;

        allCompanies.push({
          name: company.name || "Unknown",
          linkedinUrl: normalizedUrl,
          industry: company.industry || "Manufacturing",
          employeeCount: company.employeeCount || "Unknown",
          region: company.region || "Europe",
          description: company.description || "Manufacturing prospect.",
          fitScore: company.fitScore ?? 70,
          fitReason: company.fitReason || "Manufacturing company prospect.",
        });
      }

      // Throttle to prevent Make.com rate-limiting
      await new Promise((resolve) => setTimeout(resolve, 1500));

    } catch (err) {
      console.error(`Search/extract failed for query: ${query}`, err);
    }
  }

  return allCompanies;
}
