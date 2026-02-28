import { geminiJSON } from "@/lib/gemini";
import { RawContact } from "./discover-contacts";

export interface RankedContact extends RawContact {
  relevanceScore: number;
  whyContact: string;
}

interface GeminiRankResult {
  contacts: Array<{
    linkedinUrl: string;
    relevanceScore: number;
    whyContact: string;
  }>;
}

export async function rankContacts(
  contacts: RawContact[],
  companyName: string
): Promise<RankedContact[]> {
  if (contacts.length === 0) return [];

  const contactSummaries = contacts
    .map(
      (c, i) =>
        `${i + 1}. Name: ${c.name}\n   Title: ${c.title}\n   LinkedIn: ${c.linkedinUrl}`
    )
    .join("\n\n");

  const result = await geminiJSON<GeminiRankResult>(`
You are an expert B2B sales strategist for Manex AI GmbH, which sells "Qualitatio" - an AI-powered manufacturing optimization agent.

We want to sell to ${companyName}. Rank these contacts by how valuable they are for closing a deal:

${contactSummaries}

For each contact, provide:
- relevanceScore (0-100): How important this person is for the sales process
  - 90-100: Direct decision maker (CTO, VP Manufacturing, Head of Quality)
  - 70-89: Strong influencer (Director of Engineering, Plant Manager, Head of Digital)
  - 50-69: Useful contact (Senior Manager, Team Lead in relevant dept)
  - <50: Low priority (unrelated role, junior position)
- whyContact: 1 sentence explaining why the sales team should (or shouldn't) reach out to this person

Be realistic about title parsing - if a title is ambiguous or seems unrelated to manufacturing/technology/quality, score lower.

Return JSON:
{
  "contacts": [
    {
      "linkedinUrl": "...",
      "relevanceScore": 85,
      "whyContact": "..."
    }
  ]
}

Return only the top 10 most relevant contacts, sorted by relevanceScore descending.
`);

  return result.contacts
    .map((ranked) => {
      const raw = contacts.find((c) => c.linkedinUrl === ranked.linkedinUrl);
      if (!raw) return null;
      return {
        ...raw,
        relevanceScore: ranked.relevanceScore,
        whyContact: ranked.whyContact,
      };
    })
    .filter((c): c is RankedContact => c !== null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);
}
