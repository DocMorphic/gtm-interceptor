import { geminiJSON } from "@/lib/gemini";

interface ICPResult {
  searchQueries: string[];
  targetRoles: string[];
}

export async function generateICP(): Promise<ICPResult> {
  const result = await geminiJSON<ICPResult>(`
You are an expert B2B sales strategist. Manex AI GmbH sells "Qualitatio", an AI-powered manufacturing optimization agent.

Their product:
- Analyzes real-time data from ERP, MES, and production equipment
- Provides defect prediction and detection
- Steers manufacturing processes autonomously or in advisory mode
- Focused on quality management and process optimization

Their existing clients include: BMW, Audi, Stellantis, TDK Electronics, BSH (Bosch Siemens), Henkel, OSRAM.

Generate 6-8 Google search queries to find NEW prospective companies on LinkedIn.
These should be manufacturing/industrial companies that would benefit from AI-driven quality optimization.

Focus on:
- Automotive manufacturers and suppliers (Tier 1 and Tier 2)
- Electronics manufacturers
- Industrial goods / consumer goods manufacturers
- Companies in DACH region (Germany, Austria, Switzerland) and broader Europe
- Mid-market to enterprise size (200+ employees)

Each query MUST include "site:linkedin.com/company" to restrict results to LinkedIn company pages.

Also provide the top 8-10 job titles/roles at these companies that a sales team should target (decision makers who would buy manufacturing AI software).

Return JSON in this exact format:
{
  "searchQueries": ["site:linkedin.com/company ...", ...],
  "targetRoles": ["Chief Technology Officer", ...]
}
`);

  return result;
}
