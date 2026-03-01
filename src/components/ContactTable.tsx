"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScoreBadge } from "./ScoreBadge";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  linkedinUrl: string;
  relevanceScore: number;
  whyContact: string | null;
  companyId: string;
  activityCheckPending?: boolean;
  lastActivityAt?: Date | null;
  recentActivity?: string | null;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

export function ContactTable({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [hasTriggered, setHasTriggered] = useState(false);

  const pendingCount = contacts.filter((c) => c.activityCheckPending).length;
  const anyPending = pendingCount > 0;

  // 1. Trigger the Make.com PhantomBuster check on initial load
  useEffect(() => {
    if (contacts.length > 0 && !hasTriggered && !anyPending) {
      // Check if we already have recent activity or if we need to check
      const needsCheck = contacts.some(c => !c.lastActivityAt && !c.activityCheckPending);

      if (needsCheck) {
        setHasTriggered(true);
        fetch("/api/contacts/check-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: contacts[0].companyId }),
        }).then(() => {
          router.refresh();
        });
      }
    }
  }, [contacts, hasTriggered, anyPending, router]);

  // 2. Poll the server for updates if any contact is pending
  useEffect(() => {
    if (!anyPending) return;

    const intervalId = setInterval(() => {
      router.refresh(); // Refresh server data
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [anyPending, router]);

  if (contacts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-400">
          No contacts discovered yet for this company.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {contacts.map((contact, i) => {
        const isActiveToday = contact.lastActivityAt &&
          (new Date().getTime() - new Date(contact.lastActivityAt).getTime() < 24 * 60 * 60 * 1000);

        return (
          <div
            key={contact.id}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group"
          >
            {/* Rank */}
            <span className="text-xs font-medium text-gray-300 w-5 text-right tabular-nums shrink-0">
              {i + 1}
            </span>

            {/* Score */}
            <div className="shrink-0">
              <ScoreBadge score={contact.relevanceScore} size="sm" />
            </div>

            {/* Name & title */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {contact.name}
                </span>
                {contact.title && (
                  <span className="hidden sm:inline text-xs text-gray-400 truncate">
                    {contact.title}
                  </span>
                )}
              </div>
              <div className="mt-0.5 max-w-2xl">
                {contact.recentActivity ? (
                  <p className="text-[11px] text-gray-500 line-clamp-1 italic" title={contact.recentActivity}>
                    "{contact.recentActivity}"
                  </p>
                ) : contact.whyContact ? (
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {contact.whyContact}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Activity Status */}
            <div className="shrink-0 w-36 hidden md:flex items-center justify-end">
              {contact.activityCheckPending ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-[10px] font-medium text-amber-600 border border-amber-100/50">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Checking activity
                </span>
              ) : contact.lastActivityAt ? (
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium border ${isActiveToday ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {isActiveToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {isActiveToday ? "Active " : "Active "}{timeAgo(contact.lastActivityAt)}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-medium">No recent activity</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Email Button - Highlights if active today */}
              {isActiveToday ? (
                <a
                  href={`mailto:?subject=Connecting regarding Qualitatio & ${contact.name.split(" ")[0]}&body=Hi ${contact.name.split(" ")[0]},`}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Now
                </a>
              ) : (
                <a
                  href={`mailto:?subject=Connecting regarding Qualitatio & ${contact.name.split(" ")[0]}&body=Hi ${contact.name.split(" ")[0]},`}
                  className="px-2.5 py-1.5 bg-gray-50 text-gray-600 text-[11px] font-medium rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200"
                >
                  Draft Email
                </a>
              )}

              {/* LinkedIn */}
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-300 hover:text-indigo-500 rounded-md hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                title="View Profile"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
