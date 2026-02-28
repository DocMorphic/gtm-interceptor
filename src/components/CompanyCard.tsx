import Link from "next/link";
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
  return (
    <Link
      href={`/company/${company.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
          {company.name}
        </h3>
        <ScoreBadge score={company.fitScore} label="Fit" />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {company.industry && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
            {company.industry}
          </span>
        )}
        {company.employeeCount && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
            {company.employeeCount} employees
          </span>
        )}
        {company.region && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
            {company.region}
          </span>
        )}
      </div>

      {company.fitReason && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {company.fitReason}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {company._count.contacts} contact
          {company._count.contacts !== 1 ? "s" : ""} found
        </span>
        <a
          href={company.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          LinkedIn
        </a>
      </div>
    </Link>
  );
}
