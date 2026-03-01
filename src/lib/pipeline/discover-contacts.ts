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

const FALLBACK_ROLES = [
  // C-suite & founders
  "CEO",
  "CTO",
  "COO",
  "CFO",
  "CMO",
  "CIO",
  "CISO",
  "CPO",
  "Co-Founder",
  "Founder",
  "Owner",
  "President",
  "Managing Director",
  "General Manager",
  // VP-level
  "VP Engineering",
  "VP Manufacturing",
  "VP Operations",
  "VP Quality",
  "VP Supply Chain",
  "VP Production",
  "VP Technology",
  "VP Digital Transformation",
  "VP Business Development",
  "VP Sales",
  "VP Procurement",
  "VP R&D",
  "VP Product",
  "VP Strategy",
  // Director-level
  "Director of Engineering",
  "Director of Manufacturing",
  "Director of Operations",
  "Director of Quality",
  "Director of Supply Chain",
  "Director of Production",
  "Director of Technology",
  "Director of IT",
  "Director of Digital Transformation",
  "Director of Business Development",
  "Director of Procurement",
  "Director of R&D",
  "Director of Innovation",
  "Director of Continuous Improvement",
  "Director of Lean Manufacturing",
  // Head-level
  "Head of Engineering",
  "Head of Manufacturing",
  "Head of Operations",
  "Head of Quality",
  "Head of Production",
  "Head of Technology",
  "Head of Digital",
  "Head of Supply Chain",
  "Head of Procurement",
  "Head of R&D",
  "Head of Innovation",
  "Head of IT",
  "Head of Business Development",
  "Head of Sales",
  "Head of Partnerships",
  // Plant & site leadership
  "Plant Manager",
  "Plant Director",
  "Site Manager",
  "Factory Manager",
  "Production Manager",
  "Operations Manager",
  "Manufacturing Manager",
  "Quality Manager",
  // Senior management
  "Senior Vice President",
  "Senior Director",
  "Senior Manager Operations",
  "Senior Manager Manufacturing",
  "Senior Manager Quality",
  "Program Manager",
  "Technical Director",
  "Engineering Manager",
  "Supply Chain Manager",
  "Procurement Manager",
  "Purchasing Manager",
  "Buyer",
  "Senior Buyer",
  "Strategic Sourcing Manager",
  // Digital & tech roles
  "Digital Transformation Lead",
  "Industry 4.0 Lead",
  "Smart Factory Lead",
  "Automation Manager",
  "Data Science Manager",
  "AI Lead",
  "IoT Manager",
  "MES Manager",
  "ERP Manager",
  // Board & advisory
  "Board Member",
  "Advisory Board Member",
  "Non-Executive Director",
  "Chairman",
  "Supervisory Board",
  "Partner",
];

const MIN_CONTACTS = 2;

/**
 * Build a LinkedIn search URL that always works (never 404s).
 * Links to LinkedIn's people search filtered by the person's name + company.
 */
function buildLinkedInSearchUrl(name: string, companyName: string): string {
  const keywords = `${name} ${companyName}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

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
- DO NOT invent or construct LinkedIn URLs. Only use URLs that appear word-for-word in the search results.
- If you cannot find the exact URL, set linkedinUrl to "" — we will generate a search link.
- Include people even without URLs.
- Return max 7 contacts, sorted by relevanceScore descending.

Return JSON: { "contacts": [...] }
If no contacts are found, return: { "contacts": [] }
`);

  return extracted.contacts || [];
}

export async function discoverAndRankContacts(
  companyName: string,
  targetRoles: string[]
): Promise<DiscoveredContact[]> {
  const allContacts: Map<string, GeminiContactExtraction["contacts"][0]> = new Map();

  // --- Round 1: Search with the ICP target roles ---
  try {
    const roleList = targetRoles.slice(0, 5).join(", ");
    const query1 = `LinkedIn "${companyName}" employees ${roleList}`;
    const round1 = await searchAndExtract(companyName, query1);
    for (const c of round1) {
      const key = c.name.toLowerCase().trim();
      if (key && !allContacts.has(key)) allContacts.set(key, c);
    }
  } catch (err) {
    console.error(`[Contacts] Round 1 failed for ${companyName}:`, err);
  }

  // --- Round 2 (fallback): If we have < MIN_CONTACTS, search for C-suite / founders ---
  if (allContacts.size < MIN_CONTACTS) {
    try {
      const fallbackRoles = FALLBACK_ROLES.join(" OR ");
      const query2 = `LinkedIn "${companyName}" ${fallbackRoles}`;
      const round2 = await searchAndExtract(companyName, query2);
      for (const c of round2) {
        const key = c.name.toLowerCase().trim();
        if (key && !allContacts.has(key)) allContacts.set(key, c);
      }
    } catch (err) {
      console.error(`[Contacts] Round 2 (fallback) failed for ${companyName}:`, err);
    }
  }

  // --- Round 3 (last resort): Direct company leadership search ---
  if (allContacts.size < MIN_CONTACTS) {
    try {
      const query3 = `"${companyName}" CEO OR CTO OR "Managing Director" OR founder site:linkedin.com`;
      const round3 = await searchAndExtract(companyName, query3);
      for (const c of round3) {
        const key = c.name.toLowerCase().trim();
        if (key && !allContacts.has(key)) allContacts.set(key, c);
      }
    } catch (err) {
      console.error(`[Contacts] Round 3 (last resort) failed for ${companyName}:`, err);
    }
  }

  // --- Finalize: fix LinkedIn URLs and sort ---
  const results: DiscoveredContact[] = Array.from(allContacts.values())
    .map((c) => {
      // Only keep a profile URL if it's genuinely a real /in/ URL from search results
      let finalUrl: string;
      if (c.linkedinUrl && isRealProfileUrl(c.linkedinUrl)) {
        // Normalize to https://www.linkedin.com/in/slug
        const match = c.linkedinUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
        finalUrl = match
          ? `https://www.linkedin.com/in/${match[1]}`
          : buildLinkedInSearchUrl(c.name, companyName);
      } else {
        // Always fall back to a search URL — these NEVER 404
        finalUrl = buildLinkedInSearchUrl(c.name, companyName);
      }

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
