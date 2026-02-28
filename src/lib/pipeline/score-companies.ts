import { geminiJSON } from "@/lib/gemini";
import { RawCompany } from "./discover-companies";

export interface ScoredCompany extends RawCompany {
  fitScore: number;
  fitReason: string;
  industry: string;
  employeeCount: string;
  region: string;
  description: string;
}

interface GeminiScoreResult {
  companies: Array<{
    linkedinUrl: string;
    fitScore: number;
    fitReason: string;
    industry: string;
    employeeCount: string;
    region: string;
    description: string;
  }>;
}

export async function scoreCompanies(
  rawCompanies: RawCompany[]
): Promise<ScoredCompany[]> {
  if (rawCompanies.length === 0) return [];

  // Batch companies in groups of 10 to reduce Gemini API calls
  const batches: RawCompany[][] = [];
  for (let i = 0; i < rawCompanies.length; i += 10) {
    batches.push(rawCompanies.slice(i, i + 10));
  }

  const allScored: ScoredCompany[] = [];

  for (const batch of batches) {
    const companySummaries = batch
      .map(
        (c, i) =>
          `${i + 1}. Name: ${c.name}\n   LinkedIn: ${c.linkedinUrl}\n   Snippet: ${c.snippet}`
      )
      .join("\n\n");

    const result = await geminiJSON<GeminiScoreResult>(`
You are an expert B2B sales analyst for Manex AI GmbH, which sells "Qualitatio" - an AI-powered manufacturing optimization agent for quality management, defect prediction, and process steering.

Their existing clients: BMW, Audi, Stellantis, TDK Electronics, BSH, Henkel, OSRAM.

Analyze these companies found on LinkedIn and score them as potential prospects:

${companySummaries}

For each company, provide:
- fitScore (0-100): How well they match as a Manex AI prospect. 80+ = great fit, 60-79 = good, 40-59 = moderate, <40 = poor
- fitReason: 1-2 sentence explanation of why they're a good/bad fit
- industry: Their primary industry (e.g., "Automotive", "Electronics Manufacturing", "Industrial Equipment")
- employeeCount: Estimated size bracket ("1-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+")
- region: Geographic region (e.g., "DACH", "Western Europe", "Nordics", "Global")
- description: 1-2 sentence description of what the company does

IMPORTANT: Be critical. Not every company is a good fit. Score honestly based on whether they actually have manufacturing operations that would benefit from AI quality optimization.

Return JSON:
{
  "companies": [
    {
      "linkedinUrl": "...",
      "fitScore": 75,
      "fitReason": "...",
      "industry": "...",
      "employeeCount": "...",
      "region": "...",
      "description": "..."
    }
  ]
}
`);

    for (const scored of result.companies) {
      const raw = batch.find((c) => c.linkedinUrl === scored.linkedinUrl);
      if (raw && scored.fitScore >= 40) {
        allScored.push({
          ...raw,
          fitScore: scored.fitScore,
          fitReason: scored.fitReason,
          industry: scored.industry,
          employeeCount: scored.employeeCount,
          region: scored.region,
          description: scored.description,
        });
      }
    }
  }

  return allScored;
}
