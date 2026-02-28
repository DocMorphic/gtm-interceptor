import { googleSearch, SearchResult } from "@/lib/google-search";
import { prisma } from "@/lib/prisma";

export interface RawCompany {
  name: string;
  linkedinUrl: string;
  snippet: string;
}

function parseLinkedInCompany(result: SearchResult): RawCompany | null {
  // Match LinkedIn company page URLs
  const match = result.link.match(
    /linkedin\.com\/company\/([^/?#]+)/
  );
  if (!match) return null;

  // Extract company name from title (usually "CompanyName | LinkedIn" or "CompanyName - Overview")
  let name = result.title
    .replace(/\s*[|–-]\s*LinkedIn.*$/i, "")
    .replace(/\s*-\s*Overview.*$/i, "")
    .trim();

  if (!name) name = match[1].replace(/-/g, " ");

  const linkedinUrl = `https://www.linkedin.com/company/${match[1]}`;

  return { name, linkedinUrl, snippet: result.snippet };
}

export async function discoverCompanies(
  searchQueries: string[]
): Promise<RawCompany[]> {
  const allCompanies: RawCompany[] = [];
  const seenUrls = new Set<string>();

  // Check existing companies in DB to avoid duplicates
  const existing = await prisma.company.findMany({
    select: { linkedinUrl: true },
  });
  for (const c of existing) seenUrls.add(c.linkedinUrl);

  for (const query of searchQueries) {
    try {
      const results = await googleSearch(query, 10);

      for (const result of results) {
        const company = parseLinkedInCompany(result);
        if (company && !seenUrls.has(company.linkedinUrl)) {
          seenUrls.add(company.linkedinUrl);
          allCompanies.push(company);
        }
      }
    } catch (err) {
      console.error(`Search query failed: ${query}`, err);
    }
  }

  return allCompanies;
}
