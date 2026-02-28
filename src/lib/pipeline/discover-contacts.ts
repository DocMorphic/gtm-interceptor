import { googleSearch, SearchResult } from "@/lib/google-search";

export interface RawContact {
  name: string;
  title: string;
  linkedinUrl: string;
  companyLinkedinUrl: string;
}

function parseLinkedInProfile(
  result: SearchResult,
  companyLinkedinUrl: string
): RawContact | null {
  const match = result.link.match(/linkedin\.com\/in\/([^/?#]+)/);
  if (!match) return null;

  // Title usually looks like "FirstName LastName - Title - Company | LinkedIn"
  const titleParts = result.title
    .replace(/\s*[|]\s*LinkedIn.*$/i, "")
    .split(/\s*[-–]\s*/);

  const name = titleParts[0]?.trim() || match[1].replace(/-/g, " ");
  const title = titleParts[1]?.trim() || "Unknown";
  const linkedinUrl = `https://www.linkedin.com/in/${match[1]}`;

  return { name, title, linkedinUrl, companyLinkedinUrl };
}

export async function discoverContacts(
  companies: Array<{ name: string; linkedinUrl: string }>,
  targetRoles: string[]
): Promise<RawContact[]> {
  const allContacts: RawContact[] = [];
  const seenUrls = new Set<string>();

  // Build role query fragment: CTO OR "VP Engineering" OR ...
  const roleQuery = targetRoles
    .slice(0, 5) // limit to avoid overly long queries
    .map((r) => `"${r}"`)
    .join(" OR ");

  for (const company of companies) {
    try {
      // Search for key people at this company
      const query = `site:linkedin.com/in "${company.name}" ${roleQuery}`;
      const results = await googleSearch(query, 10);

      for (const result of results) {
        const contact = parseLinkedInProfile(result, company.linkedinUrl);
        if (contact && !seenUrls.has(contact.linkedinUrl)) {
          seenUrls.add(contact.linkedinUrl);
          allContacts.push(contact);
        }
      }
    } catch (err) {
      console.error(`Contact search failed for ${company.name}`, err);
    }
  }

  return allContacts;
}
