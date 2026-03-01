import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        // Expected payload from Make.com:
        // {
        //   "contactId": "cuid...",
        //   "recentActivity": "Just posted about AI in manufacturing...",
        //   "lastActivityAt": "2024-03-24T10:30:00Z" // ISO string or null
        // }
        const payload = await req.json();

        // Make.com might send an array of results or a single object
        const results = Array.isArray(payload) ? payload : [payload];
        let updatedCount = 0;

        for (const result of results) {
            if (!result.contactId) continue;

            try {
                await prisma.contact.update({
                    where: { id: result.contactId },
                    data: {
                        recentActivity: result.recentActivity || null,
                        lastActivityAt: result.lastActivityAt ? new Date(result.lastActivityAt) : null,
                        activityCheckPending: false, // Turn off the loading state
                    },
                });
                updatedCount++;
            } catch (updateErr) {
                console.error(`[Webhook] Failed to update contact ${result.contactId}:`, updateErr);
            }
        }

        if (updatedCount > 0) {
            console.log(`[Webhook] Successfully saved activity for ${updatedCount} contacts`);
        }

        return NextResponse.json(
            { success: true, updated: updatedCount },
            { status: 200 }
        );
    } catch (error) {
        console.error("[Webhook] Error processing activity webhook:", error);
        return NextResponse.json(
            { error: "Failed to process webhook" },
            { status: 500 }
        );
    }
}
