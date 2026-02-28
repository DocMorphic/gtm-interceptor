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
      <p className="text-sm text-gray-500 py-4">
        No contacts discovered yet for this company.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Name
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Title
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Score
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Why Contact
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              LinkedIn
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, i) => (
            <tr
              key={contact.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-4 text-gray-400">{i + 1}</td>
              <td className="py-3 px-4 font-medium text-gray-900">
                {contact.name}
              </td>
              <td className="py-3 px-4 text-gray-600">
                {contact.title || "Unknown"}
              </td>
              <td className="py-3 px-4">
                <ScoreBadge score={contact.relevanceScore} />
              </td>
              <td className="py-3 px-4 text-gray-600 max-w-xs">
                {contact.whyContact || "-"}
              </td>
              <td className="py-3 px-4">
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  View Profile
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
