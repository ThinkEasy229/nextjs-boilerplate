'use client';

import { useEffect, useState } from 'react';
import PortalLayout from '@/components/ops/PortalLayout';
import type { EmployeeRecord, PayrollRecord } from '@/lib/ops-store';

export default function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    weekStartDate: '',
    hoursWorked: 40,
    hourlyRate: 25,
    bonus: 0,
    deduction: 0,
    period: 'weekly',
  });

  async function loadData() {
    const [employeesResponse, payrollResponse] = await Promise.all([fetch('/api/employees'), fetch('/api/payroll')]);
    const employeesJson = (await employeesResponse.json()) as { data?: EmployeeRecord[] };
    const payrollJson = (await payrollResponse.json()) as { data?: PayrollRecord[] };
    setEmployees(employeesJson.data ?? []);
    setPayroll(payrollJson.data ?? []);
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetch('/api/employees'), fetch('/api/payroll')])
      .then(async ([employeesResponse, payrollResponse]) => {
        const employeesJson = (await employeesResponse.json()) as { data?: EmployeeRecord[] };
        const payrollJson = (await payrollResponse.json()) as { data?: PayrollRecord[] };
        if (!active) return;
        setEmployees(employeesJson.data ?? []);
        setPayroll(payrollJson.data ?? []);
      })
      .catch(() => {
        if (active) {
          setMessage('Unable to load payroll data.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function generatePayroll() {
    const response = await fetch('/api/payroll/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: form.employeeId,
        weekStartDate: form.weekStartDate,
        hoursWorked: Number(form.hoursWorked),
        hourlyRate: Number(form.hourlyRate),
        period: form.period,
        adjustments: [
          { label: 'Bonus', amount: Number(form.bonus), type: 'bonus' },
          { label: 'Deduction', amount: Number(form.deduction), type: 'deduction' },
        ].filter((entry) => entry.amount > 0),
      }),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Payroll generated.' : json.error ?? 'Unable to generate payroll.');
    if (json.success) {
      await loadData();
    }
  }

  const pendingTotal = payroll.filter((entry) => entry.status === 'pending').reduce((sum, entry) => sum + entry.netPay, 0);

  return (
    <PortalLayout
      title="Payroll management"
      subtitle="Generate weekly or monthly payroll records, calculate a 15% platform fee, include manual bonuses or deductions, and export CSV batches for external processors."
      links={[
        { href: '/hr-operations', label: 'Dashboard' },
        { href: '/hr-operations/employees', label: 'Employees' },
        { href: '/hr-operations/documents', label: 'Documents' },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Pending payouts', value: pendingTotal.toFixed(2) },
          { label: 'Payroll records', value: String(payroll.length) },
          { label: 'Employees in system', value: String(employees.length) },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Generate payroll</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <select
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            value={form.employeeId}
            onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          {['weekStartDate', 'hoursWorked', 'hourlyRate', 'bonus', 'deduction'].map((field) => (
            <input
              key={field}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
              type={field === 'weekStartDate' ? 'date' : 'number'}
              value={String(form[field as keyof typeof form])}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [field]: field === 'weekStartDate' ? event.target.value : Number(event.target.value),
                }))
              }
            />
          ))}
          <select
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            value={form.period}
            onChange={(event) => setForm((current) => ({ ...current, period: event.target.value }))}
          >
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
        </div>
        <button
          className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white"
          onClick={() => {
            void generatePayroll();
          }}
          type="button"
        >
          Calculate payroll
        </button>
        <a
          className="ml-3 inline-flex rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-200"
          href="/api/payroll?format=csv"
        >
          Export CSV
        </a>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">History</p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.24em] text-cyan-200">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Hours</th>
                <th className="pb-3">Gross</th>
                <th className="pb-3">Platform fee</th>
                <th className="pb-3">Net pay</th>
                <th className="pb-3">OT</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-800">
                  <td className="py-4 text-white">{employees.find((employee) => employee.id === entry.employeeId)?.name ?? entry.employeeId}</td>
                  <td className="py-4 text-slate-300">{entry.hoursWorked}</td>
                  <td className="py-4 text-slate-300">${entry.grossEarnings.toFixed(2)}</td>
                  <td className="py-4 text-slate-300">${entry.platformFee.toFixed(2)}</td>
                  <td className="py-4 text-cyan-200">${entry.netPay.toFixed(2)}</td>
                  <td className="py-4 text-slate-300">{entry.overtimeHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}
