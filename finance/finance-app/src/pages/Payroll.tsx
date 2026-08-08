import { useState, useEffect } from 'react';
import { DataTable } from '../components/DataTable';
import { SyncButton } from '../components/SyncButton';
import { usePayroll, useUpdatePayrollStatus } from '../hooks/useFinance';
import { useSyncPayroll } from '../hooks/useSync';
import { Calendar, Download, CheckCircle, Clock, Eye, X } from 'lucide-react';
import { hrClient } from '../services/supabaseClients';
import type { Payroll } from '../types';

export function Payroll() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const { data: payroll, isLoading } = usePayroll(selectedYear, selectedMonth);
  const syncPayroll = useSyncPayroll();
  const updateStatus = useUpdatePayrollStatus();

  // Fetch employee details when payroll is selected
  useEffect(() => {
    async function fetchEmployeeDetails() {
      if (selectedPayroll) {
        const { data, error } = await hrClient
          .from('employees')
          .select('*')
          .eq('id', selectedPayroll.employee_id)
          .single();
        
        if (error) {
          console.error('Error fetching employee details:', error);
        } else {
          setEmployeeDetails(data);
        }
      } else {
        setEmployeeDetails(null);
      }
    }
    fetchEmployeeDetails();
  }, [selectedPayroll]);

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
    },
    {
      key: 'actions' as keyof Payroll,
      label: 'Actions',
      render: (_: any, row: Payroll) => (
        <button
          onClick={() => setSelectedPayroll(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate dynamic year range (5 years back to 5 years forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

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
              {years.map(year => (
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

      {/* Detail Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Payroll Details</h2>
              <button
                onClick={() => setSelectedPayroll(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Employee Information</h3>
                {employeeDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      {employeeDetails.profile_image ? (
                        <img 
                          src={employeeDetails.profile_image} 
                          alt={employeeDetails.full_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xl font-semibold">
                            {employeeDetails.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{employeeDetails.full_name}</h4>
                        <p className="text-sm text-gray-600">{employeeDetails.job_title}{employeeDetails.department && ` • ${employeeDetails.department}`}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Employee ID:</span>
                        <p className="font-medium">{employeeDetails.employee_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium">{employeeDetails.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium">{employeeDetails.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Employment Status:</span>
                        <p className="font-medium">{employeeDetails.employment_status}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Join Date:</span>
                        <p className="font-medium">{employeeDetails.join_date || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Period:</span>
                        <p className="font-medium">{selectedPayroll.period_start} to {selectedPayroll.period_end}</p>
                      </div>
                    </div>
                    {(employeeDetails.address || employeeDetails.city || employeeDetails.country) && (
                      <div className="text-sm">
                        <span className="text-gray-500">Address:</span>
                        <p className="font-medium">
                          {[employeeDetails.address, employeeDetails.city, employeeDetails.country].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Employee ID:</span>
                      <p className="font-medium">{selectedPayroll.employee_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Period:</span>
                      <p className="font-medium">{selectedPayroll.period_start} to {selectedPayroll.period_end}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Earnings */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">Earnings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Salary:</span>
                    <span className="font-medium">ETB {selectedPayroll.basic_salary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transport Allowance:</span>
                    <span className="font-medium">ETB {selectedPayroll.transport_allowance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telephone Allowance:</span>
                    <span className="font-medium">ETB {selectedPayroll.telephone_allowance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime:</span>
                    <span className="font-medium">ETB {selectedPayroll.overtime?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Earnings:</span>
                    <span className="font-medium">ETB {selectedPayroll.other_earnings?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-2 mt-2">
                    <span className="font-semibold text-green-900">Gross Salary:</span>
                    <span className="font-bold text-green-900">ETB {selectedPayroll.gross_salary?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3">Deductions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxable Salary:</span>
                    <span className="font-medium">ETB {selectedPayroll.taxable_salary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income Tax:</span>
                    <span className="font-medium">ETB {selectedPayroll.income_tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pension (Employee 7%):</span>
                    <span className="font-medium">ETB {selectedPayroll.pension_employee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pension (Employer 11%):</span>
                    <span className="font-medium">ETB {selectedPayroll.pension_employer?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-red-200 pt-2 mt-2">
                    <span className="font-semibold text-red-900">Total Deductions:</span>
                    <span className="font-bold text-red-900">ETB {selectedPayroll.total_deductions?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900 text-lg">Net Pay:</span>
                  <span className="font-bold text-blue-900 text-2xl">ETB {selectedPayroll.net_pay?.toLocaleString()}</span>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Status & Dates</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium">{selectedPayroll.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment Date:</span>
                    <p className="font-medium">{selectedPayroll.payment_date || 'Not paid'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created At:</span>
                    <p className="font-medium">{new Date(selectedPayroll.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated At:</span>
                    <p className="font-medium">{new Date(selectedPayroll.updated_at).toLocaleString()}</p>
                  </div>
                </div>
                {selectedPayroll.notes && (
                  <div className="mt-4">
                    <span className="text-gray-500">Notes:</span>
                    <p className="font-medium mt-1">{selectedPayroll.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
