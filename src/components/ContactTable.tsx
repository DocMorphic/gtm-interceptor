import { ScoreBadge } from "./ScoreBadge";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  linkedinUrl: string;
  relevanceScore: number;
  whyContact: string | null;
}

export function ContactTable({ contacts }: { contacts: Contact[] }) {
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
      {contacts.map((contact, i) => (
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
          <div className="flex-1 min-w-0">
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
            {contact.whyContact && (
              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                {contact.whyContact}
              </p>
            )}
          </div>

          {/* LinkedIn */}
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-1.5 text-gray-300 hover:text-indigo-500 rounded-md hover:bg-indigo-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
        </div>
      ))}
    </div>
  );
}
