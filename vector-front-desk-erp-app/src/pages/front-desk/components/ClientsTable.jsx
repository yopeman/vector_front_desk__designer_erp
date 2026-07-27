export default function ClientsTable({ clients }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-800 mb-3">
        Recent Clients
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Company</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Phone</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  <a
                    href={`/clients/${c.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {c.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.company_name || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}