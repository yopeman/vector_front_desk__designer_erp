export default function KpiCards({ clients, orders, siteVisits }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Total Clients
        </p>
        <p className="text-3xl font-bold text-gray-800 mt-1">
          {clients.length}
        </p>
      </div>
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Recent Orders
        </p>
        <p className="text-3xl font-bold text-gray-800 mt-1">
          {orders.length}
        </p>
      </div>
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Site Visits
        </p>
        <p className="text-3xl font-bold text-gray-800 mt-1">
          {siteVisits.length}
        </p>
      </div>
    </div>
  );
}