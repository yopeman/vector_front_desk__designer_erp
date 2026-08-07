import { StatCard } from '../components/StatCard';
import { usePurchases, useSales, usePayroll } from '../hooks/useFinance';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const { data: purchases, isLoading: purchasesLoading, error: purchasesError } = usePurchases(1, 1000);
  const { data: sales, isLoading: salesLoading, error: salesError } = useSales(1, 1000);
  const { data: payroll, isLoading: payrollLoading, error: payrollError } = usePayroll();

  // Calculate totals
  const totalPurchases = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
  const totalSales = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
  const totalPayroll = payroll?.reduce((sum, p) => sum + (p.net_pay || 0), 0) || 0;
  const cashFlow = totalSales - totalPurchases - totalPayroll;

  const isLoading = purchasesLoading || salesLoading || payrollLoading;
  const hasError = purchasesError || salesError || payrollError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Error loading data</h2>
        <p className="text-red-700">
          {purchasesError?.message || salesError?.message || payrollError?.message || 'Unknown error'}
        </p>
        <p className="text-sm text-red-600 mt-2">
          Please check your environment variables and Supabase configuration.
        </p>
      </div>
    );
  }

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
          {!purchases?.length && !sales?.length && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
