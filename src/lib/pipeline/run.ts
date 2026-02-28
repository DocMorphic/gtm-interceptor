import { prisma } from "@/lib/prisma";
import { generateICP } from "./icp";
import { discoverAndScoreCompanies } from "./discover-companies";
import { discoverAndRankContacts } from "./discover-contacts";

export async function runPipeline() {
  const searchRun = await prisma.searchRun.create({ data: {} });

  try {
    console.log("[Pipeline] Step 1: Generating ICP and search queries...");
    const icp = await generateICP();
    console.log(
      `[Pipeline] Generated ${icp.searchQueries.length} search queries`
    );

    console.log("[Pipeline] Step 2: Discovering and scoring companies...");
    const companies = await discoverAndScoreCompanies(icp.searchQueries);
    console.log(`[Pipeline] Found ${companies.length} qualified companies`);

    // Save companies to DB
    const savedCompanies = [];
    for (const company of companies) {
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

    console.log("[Pipeline] Step 3: Discovering and ranking contacts...");
    let totalContacts = 0;

    for (const savedCompany of savedCompanies) {
      const contacts = await discoverAndRankContacts(
        savedCompany.name,
        icp.targetRoles
      );

      for (const contact of contacts) {
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
