import { StatCard } from '../components/StatCard';
import { usePurchases, useSales, usePayroll } from '../hooks/useFinance';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const { data: purchases } = usePurchases(1, 1000);
  const { data: sales } = useSales(1, 1000);
  const { data: payroll } = usePayroll();

  // Calculate totals
  const totalPurchases = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
  const totalSales = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
  const totalPayroll = payroll?.reduce((sum, p) => sum + (p.net_pay || 0), 0) || 0;
  const cashFlow = totalSales - totalPurchases - totalPayroll;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your financial data</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Purchases"
          value={`ETB ${totalPurchases.toLocaleString()}`}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Total Sales"
          value={`ETB ${totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Payroll Summary"
          value={`ETB ${totalPayroll.toLocaleString()}`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Cash Flow"
          value={`ETB ${cashFlow.toLocaleString()}`}
          icon={TrendingUp}
          color={cashFlow >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {purchases?.slice(0, 3).map((purchase) => (
            <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{purchase.purchase_no}</p>
                <p className="text-sm text-gray-600">{purchase.seller_name}</p>
              </div>
              <p className="font-semibold text-gray-900">ETB {purchase.total_amount.toLocaleString()}</p>
            </div>
          ))}
          {sales?.slice(0, 3).map((sale) => (
            <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{sale.sales_no}</p>
                <p className="text-sm text-gray-600">{sale.customer_name}</p>
              </div>
              <p className="font-semibold text-green-600">ETB {sale.total_amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
