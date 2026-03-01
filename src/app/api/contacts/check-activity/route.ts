import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { companyId } = await req.json();

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId is required" },
                { status: 400 }
            );
        }

        // 1. Fetch the company and its contacts
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { contacts: true },
        });

        if (!company) {
            return NextResponse.json(
                { error: "Company not found" },
                { status: 404 }
            );
        }

        if (company.contacts.length === 0) {
            return NextResponse.json(
                { message: "No contacts to check" },
                { status: 200 }
            );
        }

        // 2. Mark contacts as "activity check pending"
        await prisma.contact.updateMany({
            where: { companyId },
            data: { activityCheckPending: true },
        });

        // 3. Send payload to Make.com Webhook
        // This webhook should run the PhantomBuster 'LinkedIn Profile Activity Extractor'
        const webhookUrl = process.env.PHANTOMBUSTER_WEBHOOK_URL;

        if (webhookUrl && webhookUrl !== "https://hook.eu1.make.com/placeholder_phantom_webhook") {
            try {
                await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        companyId: company.id,
                        companyName: company.name,
                        contacts: company.contacts.map(c => ({
                            id: c.id,
                            name: c.name,
                            title: c.title,
                            linkedinUrl: c.linkedinUrl
                        }))
                    }),
                });
                console.log(`[PhantomBuster] Successfully triggered check for ${company.name}`);
            } catch (webhookErr) {
                console.error("[PhantomBuster] Failed to reach Make.com webhook:", webhookErr);
            }
        } else {
            console.warn("[PhantomBuster] Webhook URL not configured. Skipping Make.com trigger.");
        }

        return NextResponse.json(
            { success: true, message: `Dispatched ${company.contacts.length} contacts for checking` },
            { status: 200 }
        );
    } catch (error) {
        console.error("[PhantomBuster] Error triggering check:", error);
        return NextResponse.json(
            { error: "Failed to trigger activity check" },
            { status: 500 }
        );
    }
}
