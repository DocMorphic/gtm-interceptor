import { prisma } from "@/lib/prisma";
import { generateICP } from "@/lib/pipeline/icp";
import { discoverAndRankContacts } from "@/lib/pipeline/discover-contacts";
import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST() {
  try {
    console.log("[Rediscover] Generating ICP for target roles...");
    const icp = await generateICP();

    // Only re-process companies that have fewer than 2 contacts
    const companiesWithCounts = await prisma.company.findMany({
      orderBy: { fitScore: "desc" },
      include: { _count: { select: { contacts: true } } },
    });
    const allCompanies = companiesWithCounts.filter(c => c._count.contacts < 2).slice(0, 50);

    console.log(`[Rediscover] Re-discovering contacts for ${allCompanies.length} companies...`);

    let totalContacts = 0;
    let processed = 0;

    for (const company of allCompanies) {
      processed++;
      console.log(`[Rediscover] (${processed}/${allCompanies.length}) ${company.name}...`);

      const contacts = await discoverAndRankContacts(company.name, icp.targetRoles);

      if (contacts.length < 2) {
        console.log(`[Rediscover] Warning: ${company.name} only has ${contacts.length} real contacts`);
      }

      for (const contact of contacts) {
        await prisma.contact.upsert({
          where: { linkedinUrl: contact.linkedinUrl },
          update: {
            relevanceScore: contact.relevanceScore,
            whyContact: contact.whyContact,
            title: contact.title,
            companyId: company.id,
          },
          create: {
            name: contact.name,
            title: contact.title,
            linkedinUrl: contact.linkedinUrl,
            relevanceScore: contact.relevanceScore,
            whyContact: contact.whyContact,
            companyId: company.id,
          },
        });
        totalContacts++;
      }

      console.log(`[Rediscover] ${company.name}: ${contacts.length} contacts saved`);
    }

    console.log(`[Rediscover] Done! ${totalContacts} total contacts across ${allCompanies.length} companies`);

    return NextResponse.json({
      status: "completed",
      companiesProcessed: allCompanies.length,
      contactsFound: totalContacts,
    });
  } catch (err) {
    console.error("[Rediscover] Failed:", err);
    return NextResponse.json(
      { error: "Rediscovery failed", message: String(err) },
      { status: 500 }
    );
  }
}
