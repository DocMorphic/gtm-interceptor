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

Generate EXACTLY 2 diverse Google Search queries to find NEW prospective companies on LinkedIn.
Cast a WIDE net - any company with manufacturing or production operations is a potential prospect.

Include queries for these sectors:
- Automotive manufacturers AND suppliers
- Electronics, machinery, or industrial equipment manufacturers

Geographic scope: Primarily DACH and Europe, but also include 1-2 queries for global manufacturers.

CRITICAL RULE:
Every single query MUST be a strict Google Dork that ONLY searches for LinkedIn company pages. 
Every query MUST start with exactly: site:linkedin.com/company/

Also provide the top 10 job titles/roles that a sales team should target.

Return JSON in this exact format:
{
  "searchQueries": ["site:linkedin.com/company/ \"manufacturing\" \"germany\"", ...],
  "targetRoles": ["Chief Technology Officer", ...]
}
`);

  return result;
}
