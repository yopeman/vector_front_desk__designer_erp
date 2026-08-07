import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { SyncButton } from '../components/SyncButton';
import { usePayroll, useUpdatePayrollStatus } from '../hooks/useFinance';
import { useSyncPayroll } from '../hooks/useSync';
import { Calendar, Download, CheckCircle, Clock } from 'lucide-react';
import type { Payroll } from '../types';

export function Payroll() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { data: payroll, isLoading } = usePayroll(selectedYear, selectedMonth);
  const syncPayroll = useSyncPayroll();
  const updateStatus = useUpdatePayrollStatus();

  const handleGeneratePayroll = async () => {
    await syncPayroll.mutateAsync({ year: selectedYear, month: selectedMonth });
  };

  const handleStatusChange = async (id: string, status: 'Draft' | 'Approved' | 'Paid') => {
    await updateStatus.mutateAsync({ id, status });
  };

  const handleExportCSV = () => {
    if (!payroll || payroll.length === 0) return;

    const headers = ['Employee ID', 'Period Start', 'Period End', 'Basic Salary', 'Transport Allowance', 'Telephone Allowance', 'Overtime', 'Gross Salary', 'Taxable Salary', 'Income Tax', 'Pension Employee', 'Pension Employer', 'Total Deductions', 'Net Pay', 'Status'];
    const rows = payroll.map(p => [
      p.employee_id,
      p.period_start,
      p.period_end,
      p.basic_salary,
      p.transport_allowance,
      p.telephone_allowance,
      p.overtime,
      p.gross_salary,
      p.taxable_salary,
      p.income_tax,
      p.pension_employee,
      p.pension_employer,
      p.total_deductions,
      p.net_pay,
      p.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${selectedYear}_${selectedMonth}.csv`;
    a.click();
  };

  const columns = [
    { key: 'employee_id' as keyof Payroll, label: 'Employee ID' },
    { key: 'period_start' as keyof Payroll, label: 'Period Start' },
    { key: 'period_end' as keyof Payroll, label: 'Period End' },
    { 
      key: 'basic_salary' as keyof Payroll, 
      label: 'Basic Salary',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'overtime' as keyof Payroll, 
      label: 'Overtime',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'gross_salary' as keyof Payroll, 
      label: 'Gross Salary',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'income_tax' as keyof Payroll, 
      label: 'Income Tax',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    { 
      key: 'net_pay' as keyof Payroll, 
      label: 'Net Pay',
      render: (value: number) => `ETB ${value.toLocaleString()}`
    },
    {
      key: 'status' as keyof Payroll,
      label: 'Status',
      render: (value: string, row: Payroll) => (
        <div className="flex items-center gap-2">
          {value === 'Draft' && <Clock className="w-4 h-4 text-yellow-500" />}
          {value === 'Approved' && <CheckCircle className="w-4 h-4 text-blue-500" />}
          {value === 'Paid' && <CheckCircle className="w-4 h-4 text-green-500" />}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
            value === 'Approved' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {value}
          </span>
        </div>
      )
    }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">Manage employee payroll with progressive tax calculation</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!payroll || payroll.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <SyncButton
            onSync={handleGeneratePayroll}
            isSyncing={syncPayroll.isPending}
            label="Generate Payroll"
          />
        </div>
      </div>

      {/* Ethiopian Tax Brackets Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Ethiopian Progressive Tax Brackets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="bg-white p-2 rounded">0 - 6,000 ETB: 0%</div>
          <div className="bg-white p-2 rounded">6,001 - 16,500 ETB: 10%</div>
          <div className="bg-white p-2 rounded">16,501 - 32,000 ETB: 15%</div>
          <div className="bg-white p-2 rounded">32,001 - 52,500 ETB: 20%</div>
          <div className="bg-white p-2 rounded">52,501 - 77,000 ETB: 25%</div>
          <div className="bg-white p-2 rounded">77,001 - 109,500 ETB: 30%</div>
          <div className="bg-white p-2 rounded">109,501+ ETB: 35%</div>
          <div className="bg-white p-2 rounded">Pension: 7% employee, 11% employer</div>
        </div>
      </div>

      {/* Payroll Table */}
      <DataTable
        data={payroll || []}
        columns={columns}
        loading={isLoading}
        pagination={true}
        pageSize={20}
      />
    </div>
  );
}
