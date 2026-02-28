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

Generate 10-12 diverse search queries to find NEW prospective companies on LinkedIn.
Cast a WIDE net - any company with manufacturing or production operations is a potential prospect.

Include queries for ALL of these sectors:
- Automotive manufacturers AND suppliers (Tier 1, Tier 2, Tier 3)
- Electronics and semiconductor manufacturers
- Industrial equipment and machinery manufacturers
- Consumer goods / FMCG manufacturers (food, packaging, household)
- Pharmaceutical and medical device manufacturers
- Aerospace and defense manufacturers
- Chemical and materials manufacturers
- Energy equipment manufacturers
- Plastics, metals, and precision parts manufacturers
- Any company with factories or production lines

Geographic scope: Primarily DACH and Europe, but also include 1-2 queries for global manufacturers.
Size: ALL sizes welcome - from 50-person workshops to large enterprises.

Each query should search for LinkedIn company pages. Include terms like "LinkedIn company" or "linkedin.com/company" in the query.

Also provide the top 10 job titles/roles that a sales team should target.

Return JSON in this exact format:
{
  "searchQueries": ["LinkedIn company page manufacturing ...", ...],
  "targetRoles": ["Chief Technology Officer", ...]
}
`);

  return result;
}
