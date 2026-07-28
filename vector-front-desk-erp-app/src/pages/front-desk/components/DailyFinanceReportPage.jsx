import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function DailyFinanceReportPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [proformaData, setProformaData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      // Fetch sales invoices for the day by issue_date
      const { data: sales, error: salesError } = await supabase
        .from('invoices')
        .select('*, order:orders(order_no, client:clients(name))')
        .eq('issue_date', selectedDate)
        .eq('invoice_type', 'Sales Invoice');

      if (salesError) throw salesError;
      setSalesData(sales || []);

      // Fetch payments for the day by payment_date
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*, invoice:invoices(invoice_no, order:orders(order_no, client:clients(name)))')
        .eq('payment_date', selectedDate);

      if (paymentsError) throw paymentsError;
      setPaymentsData(payments || []);

      // Fetch proforma invoices for the day by issue_date
      const { data: proforma, error: proformaError } = await supabase
        .from('invoices')
        .select('*, order:orders(order_no, client:clients(name))')
        .eq('issue_date', selectedDate)
        .eq('invoice_type', 'Proforma');

      if (proformaError) throw proformaError;
      setProformaData(proforma || []);

      // Fetch orders for the day by order_date
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, client:clients(name)')
        .eq('order_date', selectedDate);

      if (ordersError) throw ordersError;
      setOrdersData(orders || []);

    } catch (error) {
      console.error('Error fetching daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalSales = salesData.reduce((sum, sale) => sum + (sale.grand_total || 0), 0);
    const totalPayments = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
    const totalProforma = proformaData.reduce((sum, proforma) => sum + (proforma.grand_total || 0), 0);
    const totalOrders = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      totalSales,
      totalPayments,
      totalProforma,
      totalOrders,
      salesCount: salesData.length,
      paymentsCount: paymentsData.length,
      proformaCount: proformaData.length,
      ordersCount: ordersData.length
    };
  };

  const totals = calculateTotals();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Daily Finance Report</h2>
      </div>

      {/* Date Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600">
              Report for: <span className="font-bold">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Total Sales</div>
              <div className="text-2xl font-bold text-green-600">${totals.totalSales.toFixed(2)}</div>
              <div className="text-xs text-slate-400">{totals.salesCount} invoices</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Total Payments</div>
              <div className="text-2xl font-bold text-blue-600">${totals.totalPayments.toFixed(2)}</div>
              <div className="text-xs text-slate-400">{totals.paymentsCount} payments</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Proforma Invoices</div>
              <div className="text-2xl font-bold text-purple-600">${totals.totalProforma.toFixed(2)}</div>
              <div className="text-xs text-slate-400">{totals.proformaCount} invoices</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Total Orders</div>
              <div className="text-2xl font-bold text-orange-600">${totals.totalOrders.toFixed(2)}</div>
              <div className="text-xs text-slate-400">{totals.ordersCount} orders</div>
            </div>
          </div>

          {/* Sales Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Sales Invoices ({totals.salesCount})</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Invoice No</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Amount</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {salesData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">No sales invoices found</td>
                  </tr>
                ) : (
                  salesData.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{index + 1}</td>
                      <td className="p-4">{sale.invoice_no || '-'}</td>
                      <td className="p-4">{sale.order?.order_no || '-'}</td>
                      <td className="p-4">{sale.order?.client?.name || '-'}</td>
                      <td className="p-4 font-medium">${(sale.total_amount || 0).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'Paid' ? 'bg-green-100 text-green-700' :
                          sale.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Payments ({totals.paymentsCount})</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Invoice No</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Amount</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Method</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paymentsData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">No payments found</td>
                  </tr>
                ) : (
                  paymentsData.map((payment, index) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{index + 1}</td>
                      <td className="p-4">{payment.invoice?.invoice_no || '-'}</td>
                      <td className="p-4">{payment.client?.name || '-'}</td>
                      <td className="p-4 font-medium">${(payment.amount || 0).toFixed(2)}</td>
                      <td className="p-4">{payment.payment_method || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Proforma Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Proforma Invoices ({totals.proformaCount})</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Invoice No</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Amount</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {proformaData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">No proforma invoices found</td>
                  </tr>
                ) : (
                  proformaData.map((proforma, index) => (
                    <tr key={proforma.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{index + 1}</td>
                      <td className="p-4">{proforma.invoice_no || '-'}</td>
                      <td className="p-4">{proforma.order?.order_no || '-'}</td>
                      <td className="p-4">{proforma.order?.client?.name || '-'}</td>
                      <td className="p-4 font-medium">${(proforma.total_amount || 0).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          proforma.status === 'Paid' ? 'bg-green-100 text-green-700' :
                          proforma.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {proforma.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Orders ({totals.ordersCount})</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Amount</th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ordersData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">No orders found</td>
                  </tr>
                ) : (
                  ordersData.map((order, index) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{index + 1}</td>
                      <td className="p-4">{order.order_no || '-'}</td>
                      <td className="p-4">{order.client?.name || '-'}</td>
                      <td className="p-4 font-medium">${(order.total_amount || 0).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
