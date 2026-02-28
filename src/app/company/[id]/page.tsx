import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ContactTable } from "@/components/ContactTable";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { relevanceScore: "desc" } },
    },
  });

  if (!company) notFound();

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to prospects
      </Link>

      {/* Company Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {company.industry && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                  {company.industry}
                </span>
              )}
              {company.employeeCount && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                  {company.employeeCount} employees
                </span>
              )}
              {company.region && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                  {company.region}
                </span>
              )}
            </div>
          </div>
          <ScoreBadge score={company.fitScore} label="Fit Score" />
        </div>

        {company.description && (
          <p className="text-sm text-gray-700 mb-3">{company.description}</p>
        )}

        {company.fitReason && (
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Why this company: </span>
              {company.fitReason}
            </p>
          </div>
        )}

        <a
          href={company.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View on LinkedIn
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Key Contacts ({company.contacts.length})
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ranked by decision-making relevance for selling Industrial AI
          </p>
        </div>
        <div className="p-6">
          <ContactTable contacts={company.contacts} />
        </div>
      </div>
    </div>
  );
}
