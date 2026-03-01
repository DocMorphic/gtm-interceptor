"use client";

import { useRouter } from "next/navigation";
import { ScoreBadge } from "./ScoreBadge";

interface CompanyCardProps {
  id: string;
  name: string;
  industry: string | null;
  employeeCount: string | null;
  region: string | null;
  fitScore: number;
  fitReason: string | null;
  linkedinUrl: string;
  _count: { contacts: number };
}

export function CompanyCard({ company }: { company: CompanyCardProps }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/company/${company.id}`)}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-0"
    >
      {/* Score ring */}
      <div className="shrink-0">
        <ScoreBadge score={company.fitScore} size="md" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-0.5">
          <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {company.name}
          </h3>
          {company.industry && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500 uppercase tracking-wider shrink-0">
              {company.industry}
            </span>
          )}
        </div>
        {company.fitReason && (
          <p className="text-xs text-gray-400 line-clamp-1">
            {company.fitReason}
          </p>
        )}
      </div>

      {/* Meta chips */}
      <div className="hidden md:flex items-center gap-3 shrink-0 text-xs text-gray-400">
        {company.region && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            {company.region}
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          {company._count.contacts}
        </span>
      </div>

      {/* LinkedIn + Arrow */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={company.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-gray-300 hover:text-indigo-500 rounded-md hover:bg-indigo-50 transition-all"
          title="View on LinkedIn"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </a>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
