import { webSearch } from "@/lib/google-search";
import { geminiJSON } from "@/lib/gemini";

export interface DiscoveredContact {
  name: string;
  title: string;
  linkedinUrl: string;
  companyName: string;
  relevanceScore: number;
  whyContact: string;
}

interface GeminiContactExtraction {
  contacts: Array<{
    name: string;
    title: string;
    linkedinUrl: string;
    relevanceScore: number;
    whyContact: string;
  }>;
}

const MIN_CONTACTS = 2;

/**
 * Check if a URL is a real LinkedIn profile URL (not a search or invented slug).
 */
function isRealProfileUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(url);
}

/**
 * Run a single round of contact search + Gemini extraction.
 */
async function searchAndExtract(
  companyName: string,
  searchQuery: string
): Promise<GeminiContactExtraction["contacts"]> {
  const searchText = await webSearch(searchQuery);
  if (!searchText || searchText.length < 50) return [];

  const extracted = await geminiJSON<GeminiContactExtraction>(`
You are a B2B sales researcher for Manex AI GmbH, which sells "Qualitatio" — an AI-powered manufacturing optimization agent.

We want to sell to "${companyName}". Extract key contacts/employees from these search results.

SEARCH RESULTS:
${searchText}

For each person found, extract:
- name: Full name
- title: Job title
- linkedinUrl: Their LinkedIn profile URL ONLY if the EXACT URL appears verbatim in the search results. If not found, set to ""
- relevanceScore: 0-100 based on decision-making authority
  - 90-100: C-level, VP of Manufacturing/Engineering/Quality
  - 70-89: Director, Head of department, Plant Manager
  - 50-69: Senior Manager in relevant area
  - <50: Other roles
- whyContact: 1 sentence explaining why sales should contact this person

CRITICAL RULES:
- ONLY include people whose REAL FULL NAME you found in the search results. A real name is like "John Smith" or "Maria Müller".
- NEVER use placeholder names like "Unknown", "Unknown Name", "Unknown C-Level Executive", "CEO of CompanyName", "Not enough info", etc. If you don't know the person's actual name, DO NOT include them.
- ONLY include people who have a REAL LinkedIn profile URL (https://www.linkedin.com/in/...) that appears VERBATIM in the search results. If you cannot find their exact LinkedIn profile URL, DO NOT include them at all.
- DO NOT invent or construct LinkedIn URLs. Only use URLs that appear word-for-word in the search results.
- Skip anyone without a verified LinkedIn profile URL. We only want contacts we can actually link to.
- Return max 7 contacts, sorted by relevanceScore descending.

Return JSON: { "contacts": [...] }
If no contacts are found at all, return: { "contacts": [] }
`);

  // Filter out garbage names at the code level
  const validContacts = (extracted.contacts || []).filter((c) => {
    const name = c.name.toLowerCase().trim();
    if (!name || name.length < 3) return false;
    if (name.includes("unknown")) return false;
    if (name.includes("not enough")) return false;
    if (name.startsWith("ceo of") || name.startsWith("cto of") || name.startsWith("coo of") || name.startsWith("cfo of")) return false;
    if (c.title?.toLowerCase() === "unknown") return false;
    return true;
  });

  return validContacts;
}

export async function discoverAndRankContacts(
  companyName: string,
  targetRoles: string[]
): Promise<DiscoveredContact[]> {
  const allContacts: Map<string, GeminiContactExtraction["contacts"][0]> = new Map();

  // --- Round 1: site:linkedin.com/in/ search with ICP target roles ---
  try {
    const roleList = targetRoles.slice(0, 5).join(" OR ");
    const query1 = `site:linkedin.com/in/ "${companyName}" ${roleList}`;
    const round1 = await searchAndExtract(companyName, query1);
    for (const c of round1) {
      const key = c.name.toLowerCase().trim();
      if (key && !allContacts.has(key)) allContacts.set(key, c);
    }
  } catch (err) {
    console.error(`[Contacts] Round 1 failed for ${companyName}:`, err);
  }

  // --- Round 2 (fallback): broader leadership search on linkedin.com/in/ ---
  if (allContacts.size < MIN_CONTACTS) {
    try {
      const query2 = `site:linkedin.com/in/ "${companyName}" CEO OR CTO OR COO OR "Managing Director" OR "VP" OR "Head of" OR "Director"`;
      const round2 = await searchAndExtract(companyName, query2);
      for (const c of round2) {
        const key = c.name.toLowerCase().trim();
        if (key && !allContacts.has(key)) allContacts.set(key, c);
      }
    } catch (err) {
      console.error(`[Contacts] Round 2 (fallback) failed for ${companyName}:`, err);
    }
  }

  // --- Round 3 (last resort): just the company name on linkedin profiles ---
  if (allContacts.size < MIN_CONTACTS) {
    try {
      const query3 = `site:linkedin.com/in/ "${companyName}"`;
      const round3 = await searchAndExtract(companyName, query3);
      for (const c of round3) {
        const key = c.name.toLowerCase().trim();
        if (key && !allContacts.has(key)) allContacts.set(key, c);
      }
    } catch (err) {
      console.error(`[Contacts] Round 3 (last resort) failed for ${companyName}:`, err);
    }
  }

  // --- Finalize: only keep contacts with real LinkedIn profile URLs ---
  const results: DiscoveredContact[] = Array.from(allContacts.values())
    .filter((c) => c.linkedinUrl && isRealProfileUrl(c.linkedinUrl))
    .map((c) => {
      const match = c.linkedinUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
      const finalUrl = match
        ? `https://www.linkedin.com/in/${match[1]}`
        : c.linkedinUrl;

      return {
        name: c.name,
        title: c.title || "Unknown",
        linkedinUrl: finalUrl,
        companyName,
        relevanceScore: c.relevanceScore,
        whyContact: c.whyContact || `Key contact at ${companyName}`,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 7);

  return results;
}
