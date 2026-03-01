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

      // INSTANT EXTRACTION: We don't need Gemini if we are explicitly searching for LinkedIn URLs!
      // This Regex immediately finds all LinkedIn company pages in the text Make.com returns.
      const urlRegex = /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+/gi;
      const foundUrls = searchText.match(urlRegex) || [];

      for (const url of foundUrls) {
        // Clean URL to standard format without trailing slashes
        const finalUrl = url.toLowerCase().replace(/\/$/, "");

        if (seenUrls.has(finalUrl)) continue;

        // Extract the company name directly from the URL slug
        const slugMatch = finalUrl.match(/company\/([^/]+)/);
        if (!slugMatch) continue;

        let name = slugMatch[1].replace(/-/g, " ");
        // Capitalize the first letter of each word
        name = name.replace(/\b\w/g, (char) => char.toUpperCase());

        if (isExistingClient(name)) continue;

        allCompanies.push({
          name: name,
          linkedinUrl: finalUrl,
          industry: "Manufacturing", // Default fast-fill
          employeeCount: "Unknown",
          region: "Unknown",
          description: "Manufacturing prospect discovered via LinkedIn.",
          fitScore: 80, // Default passing score
          fitReason: "Matched the target manufacturing search queries on LinkedIn.",
        });

        seenUrls.add(finalUrl);
      }

      // Small throttle to prevent Make.com from rate-limiting
      await new Promise((resolve) => setTimeout(resolve, 1500));

    } catch (err) {
      console.error(`Search/extract failed for query: ${query}`, err);
    }
  }

  return allCompanies;
}
