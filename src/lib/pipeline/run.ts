import { prisma } from "@/lib/prisma";
import { generateICP } from "./icp";
import { discoverCompanies } from "./discover-companies";
import { scoreCompanies } from "./score-companies";
import { discoverContacts } from "./discover-contacts";
import { rankContacts } from "./rank-contacts";

export async function runPipeline() {
  // Create a search run record
  const searchRun = await prisma.searchRun.create({ data: {} });

  try {
    console.log("[Pipeline] Step 1: Generating ICP and search queries...");
    const icp = await generateICP();
    console.log(
      `[Pipeline] Generated ${icp.searchQueries.length} search queries`
    );

    console.log("[Pipeline] Step 2: Discovering companies...");
    const rawCompanies = await discoverCompanies(icp.searchQueries);
    console.log(`[Pipeline] Found ${rawCompanies.length} new companies`);

    console.log("[Pipeline] Step 3: Scoring companies with Gemini...");
    const scoredCompanies = await scoreCompanies(rawCompanies);
    console.log(
      `[Pipeline] ${scoredCompanies.length} companies passed scoring threshold`
    );

    // Save companies to DB
    const savedCompanies = [];
    for (const company of scoredCompanies) {
      const saved = await prisma.company.upsert({
        where: { linkedinUrl: company.linkedinUrl },
        update: {
          fitScore: company.fitScore,
          fitReason: company.fitReason,
          industry: company.industry,
          employeeCount: company.employeeCount,
          region: company.region,
          description: company.description,
        },
        create: {
          name: company.name,
          linkedinUrl: company.linkedinUrl,
          industry: company.industry,
          employeeCount: company.employeeCount,
          region: company.region,
          description: company.description,
          fitScore: company.fitScore,
          fitReason: company.fitReason,
        },
      });
      savedCompanies.push(saved);
    }

    console.log("[Pipeline] Step 4: Discovering contacts...");
    const rawContacts = await discoverContacts(
      scoredCompanies.map((c) => ({ name: c.name, linkedinUrl: c.linkedinUrl })),
      icp.targetRoles
    );
    console.log(`[Pipeline] Found ${rawContacts.length} raw contacts`);

    console.log("[Pipeline] Step 5: Ranking contacts with Gemini...");
    let totalContacts = 0;

    // Group contacts by company and rank per company
    for (const savedCompany of savedCompanies) {
      const companyContacts = rawContacts.filter(
        (c) => c.companyLinkedinUrl === savedCompany.linkedinUrl
      );

      if (companyContacts.length === 0) continue;

      const ranked = await rankContacts(companyContacts, savedCompany.name);

      for (const contact of ranked) {
        await prisma.contact.upsert({
          where: { linkedinUrl: contact.linkedinUrl },
          update: {
            relevanceScore: contact.relevanceScore,
            whyContact: contact.whyContact,
            title: contact.title,
            companyId: savedCompany.id,
          },
          create: {
            name: contact.name,
            title: contact.title,
            linkedinUrl: contact.linkedinUrl,
            relevanceScore: contact.relevanceScore,
            whyContact: contact.whyContact,
            companyId: savedCompany.id,
          },
        });
        totalContacts++;
      }
    }

    // Mark search run as completed
    await prisma.searchRun.update({
      where: { id: searchRun.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        companiesFound: savedCompanies.length,
        contactsFound: totalContacts,
      },
    });

    console.log(
      `[Pipeline] Complete! ${savedCompanies.length} companies, ${totalContacts} contacts`
    );

    return {
      status: "completed",
      companiesFound: savedCompanies.length,
      contactsFound: totalContacts,
    };
  } catch (err) {
    console.error("[Pipeline] Failed:", err);

    await prisma.searchRun.update({
      where: { id: searchRun.id },
      data: { status: "failed", completedAt: new Date() },
    });

    throw err;
  }
}
