import { StatCard } from '../components/StatCard';
import { usePurchases, useSales, usePayroll } from '../hooks/useFinance';
import { DollarSign, ShoppingCart, Users, TrendingUp, LayoutDashboard, BookOpen, Package, FileText, BarChart3, MessageSquare, Bell, StickyNote, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function Dashboard() {
  const { data: purchases, isLoading: purchasesLoading, error: purchasesError } = usePurchases(1, 1000);
  const { data: sales, isLoading: salesLoading, error: salesError } = useSales(1, 1000);
  const { data: payroll, isLoading: payrollLoading, error: payrollError } = usePayroll();

  // Calculate totals
  const totalPurchases = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
  const totalSales = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
  const totalPayroll = payroll?.reduce((sum, p) => sum + (p.net_pay || 0), 0) || 0;
  const cashFlow = totalSales - totalPurchases - totalPayroll;

  // Prepare chart data
  const salesVsPurchasesData = [
    { name: 'Sales', value: totalSales, color: '#10b981' },
    { name: 'Purchases', value: totalPurchases, color: '#3b82f6' },
    { name: 'Payroll', value: totalPayroll, color: '#8b5cf6' },
  ];

  // Group sales and purchases by month for real data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const groupByMonth = (data: any[], dateField: string) => {
    const grouped: Record<string, number> = {};
    data?.forEach(item => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      if (!grouped[monthName]) {
        grouped[monthName] = 0;
      }
      grouped[monthName] += item.total_amount || 0;
    });
    return grouped;
  };

  const salesByMonth = groupByMonth(sales || [], 'sales_date');
  const purchasesByMonth = groupByMonth(purchases || [], 'purchase_date');

  // Get all unique months from both datasets
  const allMonths = Array.from(new Set([...Object.keys(salesByMonth), ...Object.keys(purchasesByMonth)]));

  // Create monthly trends data with real values
  const monthlyTrendsData = allMonths.map(month => ({
    month,
    sales: salesByMonth[month] || 0,
    purchases: purchasesByMonth[month] || 0,
  })).sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

  // If no data available, show empty chart with current month
  if (monthlyTrendsData.length === 0) {
    const currentMonth = monthNames[new Date().getMonth()];
    monthlyTrendsData.push({ month: currentMonth, sales: 0, purchases: 0 });
  }

  // Cash flow trend
  const cashFlowData = monthlyTrendsData.map(item => ({
    month: item.month,
    cashFlow: item.sales - item.purchases - (monthlyTrendsData.length > 0 ? totalPayroll / monthlyTrendsData.length : 0)
  }));

  // Quick links from sidebar
  const quickLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'purple' },
    { path: '/purchases', label: 'Purchase', icon: ShoppingCart, color: 'blue' },
    { path: '/sales', label: 'Sales', icon: DollarSign, color: 'green' },
    { path: '/chart-of-accounts', label: 'Chart of Accounts', icon: BookOpen, color: 'purple' },
    { path: '/general-journal', label: 'General Journal', icon: FileText, color: 'gray' },
    { path: '/inventory', label: 'Inventory', icon: Package, color: 'orange' },
    { path: '/payroll', label: 'Payroll', icon: Users, color: 'pink' },
    { path: '/reports', label: 'Report', icon: BarChart3, color: 'indigo' },
    { path: '/messages', label: 'Messages', icon: MessageSquare, color: 'cyan' },
    { path: '/notifications', label: 'Notifications', icon: Bell, color: 'yellow' },
    { path: '/notes', label: 'Notes', icon: StickyNote, color: 'lime' },
    { path: '/settings', label: 'Settings', icon: Settings, color: 'slate' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    pink: 'bg-pink-50 text-pink-600 hover:bg-pink-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    cyan: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
    yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
    lime: 'bg-lime-50 text-lime-600 hover:bg-lime-100',
    slate: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
  };

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Purchases vs Payroll Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesVsPurchasesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {salesVsPurchasesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `ETB ${(value || 0).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `ETB ${(value || 0).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill="#10b981" />
              <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Trend Line Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `ETB ${(value || 0).toLocaleString()}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cashFlow" 
                name="Cash Flow" 
                stroke={cashFlow >= 0 ? "#10b981" : "#ef4444"}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg transition-colors
                    ${colorMap[link.color]}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.label}</span>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
