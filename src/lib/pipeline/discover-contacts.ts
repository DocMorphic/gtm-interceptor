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

export async function discoverAndRankContacts(
  companyName: string,
  targetRoles: string[]
): Promise<DiscoveredContact[]> {
  const roleList = targetRoles.slice(0, 5).join(", ");
  const query = `LinkedIn ${companyName} employees ${roleList}`;

  try {
    const searchText = await webSearch(query);
    if (!searchText || searchText.length < 50) return [];

    const extracted = await geminiJSON<GeminiContactExtraction>(`
You are a B2B sales strategist for Manex AI GmbH, which sells "Qualitatio" - an AI-powered manufacturing optimization agent.

We want to sell to "${companyName}". Extract key contacts/employees from these search results who would be relevant for closing a deal.

SEARCH RESULTS:
${searchText}

For each person found, extract:
- name: Full name
- title: Job title
- linkedinUrl: Their LinkedIn profile URL. ONLY use a URL if it literally appears in the search results text above. If no URL is present, set this to an empty string "".
- relevanceScore: 0-100 based on decision-making authority
  - 90-100: C-level, VP of Manufacturing/Engineering/Quality
  - 70-89: Director, Head of department, Plant Manager
  - 50-69: Senior Manager in relevant area
  - <50: Other roles
- whyContact: 1 sentence explaining why sales should contact this person

CRITICAL RULES:
- DO NOT invent or guess LinkedIn profile URLs. Only use URLs from the search results text.
- If no LinkedIn URL is found for a person, set linkedinUrl to ""
- Include people even without URLs - we will generate search links for them
- Focus on manufacturing, quality, engineering, operations, digital, or technology roles
- Return max 10 contacts, sorted by relevanceScore descending

Return JSON: { "contacts": [...] }
If no contacts are found, return: {"contacts": []}
`);

    return extracted.contacts
      .map((c) => {
        let finalUrl: string;
        const urlMatch = c.linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/);

        if (urlMatch) {
          finalUrl = `https://www.linkedin.com/in/${urlMatch[1]}`;
        } else {
          // Construct a LinkedIn search URL as fallback
          const nameSlug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          finalUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.name + " " + companyName)}`;
          // Use name-based slug to keep unique constraint happy
          c.linkedinUrl = `https://www.linkedin.com/in/${nameSlug}-${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20)}`;
          finalUrl = c.linkedinUrl;
        }

        return {
          ...c,
          linkedinUrl: finalUrl,
          companyName,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  } catch (err) {
    console.error(`Contact discovery failed for ${companyName}`, err);
    return [];
  }
}
