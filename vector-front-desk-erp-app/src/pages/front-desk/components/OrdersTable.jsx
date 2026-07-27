export default function OrdersTable({ orders }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-800 mb-3">
        Recent Orders
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">Order No</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Client</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {o.order_no}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {o.clients?.name || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  ETB {Number(o.total_amount || 0).toLocaleString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}