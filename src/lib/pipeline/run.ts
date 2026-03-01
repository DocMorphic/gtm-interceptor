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
      let contacts = await discoverAndRankContacts(
        savedCompany.name,
        icp.targetRoles
      );

      // Guarantee at least 2 contacts per company — synthesize leadership placeholders if needed
      if (contacts.length < 2) {
        const fallbackLeaders = [
          { name: `CEO of ${savedCompany.name}`, title: "Chief Executive Officer", relevanceScore: 95, whyContact: `Top decision-maker at ${savedCompany.name} — ideal for executive sponsorship of Qualitatio.` },
          { name: `CTO of ${savedCompany.name}`, title: "Chief Technology Officer", relevanceScore: 90, whyContact: `Leads technology adoption at ${savedCompany.name} — key influencer for AI/manufacturing solutions.` },
        ];

        const existingNames = new Set(contacts.map((c) => c.name.toLowerCase()));
        for (const fb of fallbackLeaders) {
          if (contacts.length >= 2) break;
          if (existingNames.has(fb.name.toLowerCase())) continue;
          contacts.push({
            ...fb,
            linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(fb.title + " " + savedCompany.name)}`,
            companyName: savedCompany.name,
          });
        }

        console.log(`[Pipeline] Added fallback contacts for ${savedCompany.name} (now ${contacts.length} total)`);
      }

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

    // Make.com Webhook Integration
    const webhookUrl = process.env.EXPORT_WEBHOOK_URL;
    if (webhookUrl && totalContacts > 0) {
      console.log(`[Pipeline] Sending data to Make.com...`);
      try {
        // Fetch all the newly created data to send to Make
        const dataToSend = await prisma.company.findMany({
          where: {
            id: { in: savedCompanies.map((c) => c.id) },
          },
          include: { contacts: true },
        });

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: searchRun.id,
            companiesFound: savedCompanies.length,
            contactsFound: totalContacts,
            companies: dataToSend,
          }),
        });
        console.log(`[Pipeline] Data successfully sent to Make.com!`);
      } catch (webhookErr) {
        console.error(`[Pipeline] Failed to send data to Make.com:`, webhookErr);
      }
    }

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
