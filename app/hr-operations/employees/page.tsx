'use client';

import { useEffect, useMemo, useState } from 'react';
import PortalLayout from '@/components/ops/PortalLayout';
import type { DriverApplication, EmployeeRecord, ShiftAssignment } from '@/lib/ops-store';

const emptyEmployee = {
  name: '',
  email: '',
  phone: '',
  address: '',
  dob: '',
  ssn: '',
  role: 'Driver',
  emergencyContact: '',
};

const emptyShift = {
  employeeId: '',
  date: '',
  startTime: '09:00',
  endTime: '17:00',
  scheduledHours: 8,
  actualHours: 8,
  notes: '',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [form, setForm] = useState(emptyEmployee);
  const [shiftForm, setShiftForm] = useState(emptyShift);
  const [message, setMessage] = useState('');

  async function loadData() {
    const [employeesResponse, applicationsResponse] = await Promise.all([
      fetch('/api/employees'),
      fetch('/api/driver-applications'),
    ]);
    const employeesJson = (await employeesResponse.json()) as { data?: EmployeeRecord[] };
    const applicationsJson = (await applicationsResponse.json()) as { data?: DriverApplication[] };
    setEmployees(employeesJson.data ?? []);
    setApplications(applicationsJson.data ?? []);
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetch('/api/employees'), fetch('/api/driver-applications')])
      .then(async ([employeesResponse, applicationsResponse]) => {
        const employeesJson = (await employeesResponse.json()) as { data?: EmployeeRecord[] };
        const applicationsJson = (await applicationsResponse.json()) as { data?: DriverApplication[] };
        if (!active) return;
        setEmployees(employeesJson.data ?? []);
        setApplications(applicationsJson.data ?? []);
      })
      .catch(() => {
        if (active) {
          setMessage('Unable to load employee data.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const approvedApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === 'approved' &&
          !employees.some((employee) => employee.sourceApplicationId === application.id)
      ),
    [applications, employees]
  );

  async function createEmployee() {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Employee created.' : json.error ?? 'Unable to create employee.');
    if (json.success) {
      setForm(emptyEmployee);
      await loadData();
    }
  }

  async function convertApplication(sourceApplicationId: string) {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceApplicationId, role: 'Driver' }),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? 'Approved driver converted to employee.' : json.error ?? 'Unable to convert.');
    if (json.success) {
      await loadData();
    }
  }

  async function updateStatus(employee: EmployeeRecord, status: EmployeeRecord['status']) {
    await fetch(`/api/employees/${employee.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadData();
  }

  async function assignShift() {
    const target = employees.find((employee) => employee.id === shiftForm.employeeId);
    if (!target) {
      setMessage('Choose an employee before assigning a shift.');
      return;
    }

    const overtimeHours = Math.max(0, shiftForm.actualHours - 8);
    const nextShift: ShiftAssignment = {
      id: `shift-${Date.now()}`,
      date: shiftForm.date,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      scheduledHours: Number(shiftForm.scheduledHours),
      actualHours: Number(shiftForm.actualHours),
      overtimeHours,
      notes: shiftForm.notes,
    };

    await fetch(`/api/employees/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shiftAssignments: [nextShift, ...target.shiftAssignments],
      }),
    });
    setShiftForm(emptyShift);
    setMessage('Shift assigned.');
    await loadData();
  }

  async function reviewApplication(id: string, status: 'approved' | 'rejected' | 'changes-requested') {
    const response = await fetch(`/api/driver-applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = (await response.json()) as { success: boolean; error?: string };
    setMessage(json.success ? `Application ${status}.` : json.error ?? 'Unable to update application.');
    if (json.success) {
      await loadData();
    }
  }

  return (
    <PortalLayout
      title="Employee roster"
      subtitle="Create employee records manually or convert approved drivers, manage soft-delete status changes, and schedule weekly shifts with overtime tracking."
      links={[
        { href: '/hr-operations', label: 'Dashboard' },
        { href: '/hr-operations/payroll', label: 'Payroll' },
        { href: '/hr-operations/documents', label: 'Documents' },
      ]}
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Add employee</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {Object.entries(form).map(([key, value]) => (
              <label key={key} className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {key}
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  value={value}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
          <button
            className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white"
            onClick={() => {
              void createEmployee();
            }}
            type="button"
          >
            Create employee
          </button>
          {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Convert approved drivers</p>
          <div className="mt-5 space-y-3">
            {approvedApplications.length > 0 ? (
              approvedApplications.map((application) => (
                <div key={application.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{application.name}</p>
                      <p className="text-sm text-slate-400">{application.email}</p>
                    </div>
                    <button
                      className="rounded-full border border-cyan-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"
                      onClick={() => {
                        void convertApplication(application.id);
                      }}
                      type="button"
                    >
                      Convert
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                No approved driver applications waiting to be converted.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Assign shifts</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <select
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            value={shiftForm.employeeId}
            onChange={(event) => setShiftForm((current) => ({ ...current, employeeId: event.target.value }))}
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          {['date', 'startTime', 'endTime', 'scheduledHours', 'actualHours', 'notes'].map((field) => (
            <input
              key={field}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
              type={field === 'date' ? 'date' : field.includes('Hours') ? 'number' : 'text'}
              value={String(shiftForm[field as keyof typeof shiftForm] ?? '')}
              onChange={(event) =>
                setShiftForm((current) => ({
                  ...current,
                  [field]: field.includes('Hours') ? Number(event.target.value) : event.target.value,
                }))
              }
            />
          ))}
        </div>
        <button
          className="mt-5 rounded-full border border-cyan-500/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200"
          onClick={() => {
            void assignShift();
          }}
          type="button"
        >
          Save shift
        </button>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Application review</p>
        <div className="mt-5 space-y-3">
          {applications.map((application) => (
            <div key={application.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{application.name}</p>
                  <p className="text-sm text-slate-400">
                    {application.vehicleYear} {application.vehicleMake} {application.vehicleModel}
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-200">
                  {application.status}
                </span>
              </div>
              {application.status === 'pending' ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['approved', 'changes-requested', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      className="rounded-full border border-cyan-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"
                      onClick={() => {
                        void reviewApplication(application.id, status);
                      }}
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Roster</p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.24em] text-cyan-200">
                <th className="pb-3">Name</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Documents</th>
                <th className="pb-3">Shift hours</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-slate-800">
                  <td className="py-4">
                    <p className="font-semibold text-white">{employee.name}</p>
                    <p className="text-xs text-slate-400">{employee.email}</p>
                  </td>
                  <td className="py-4 text-slate-300">{employee.role}</td>
                  <td className="py-4">
                    <select
                      className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white"
                      value={employee.status}
                      onChange={(event) => {
                        void updateStatus(employee, event.target.value as EmployeeRecord['status']);
                      }}
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="on-leave">on-leave</option>
                    </select>
                  </td>
                  <td className="py-4 text-slate-300">{employee.documents.length}</td>
                  <td className="py-4 text-slate-300">
                    {employee.shiftAssignments.reduce((sum, shift) => sum + shift.actualHours, 0)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}
