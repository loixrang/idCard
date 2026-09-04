"use client";

import { useMemo, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { studentsService } from "@/services/students.service";
import { cardsService } from "@/services/cards.service";
import { guardiansService } from "@/services/guardians.service";

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const students = useAsyncData(() => studentsService.list({ page, limit: 25 }), [page]);
  const filtered = useMemo(() => {
    const rows = students.data?.students || [];
    return rows.filter((s) => [s.name, s.admissionNumber, s.class].join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [students.data, query]);
  const active = selected || filtered[0];

  async function unregister(student) {
    if (!confirm(`Unregister ${student.name}?`)) return;
    await studentsService.unregister(student.id);
    students.reload();
  }

  return (
    <DashboardShell>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Student Directory</h2>
              <p className="text-sm text-on-surface-variant">Manage student records, ID tags, and guardians.</p>
            </div>
            <button className="btn-primary" onClick={() => setModal("student")}>Add New Student</button>
          </div>
          <div className="border-b border-outline-variant p-4">
            <input className="field max-w-md" placeholder="Search students, admission numbers, classes..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {students.loading ? <LoadingState /> : students.error ? <ErrorState message={students.error} onRetry={students.reload} /> : filtered.length ? (
            <>
              <div className="overflow-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-surface-container-low text-xs font-semibold uppercase text-on-surface-variant">
                    <tr><th className="p-3">Student</th><th className="p-3">Admission Number</th><th className="p-3">Class</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map((student) => (
                      <tr className={`cursor-pointer hover:bg-surface-container-low ${active?.id === student.id ? "border-l-2 border-l-primary bg-secondary-container/20" : "border-l-2 border-l-transparent"}`} key={student.id} onClick={() => setSelected(student)}>
                        <td className="p-3 font-semibold">{student.name}</td>
                        <td className="p-3 font-mono text-xs text-on-surface-variant">{student.admissionNumber}</td>
                        <td className="p-3 text-on-surface-variant">{student.class}</td>
                        <td className="p-3"><StatusBadge value={student.status} /></td>
                        <td className="p-3 text-right">
                          <button className="font-semibold text-primary" onClick={(e) => { e.stopPropagation(); setSelected(student); setModal("edit"); }}>Edit</button>
                          <button className="ml-3 font-semibold text-error" onClick={(e) => { e.stopPropagation(); unregister(student); }}>Unregister</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={students.data?.pagination} page={page} setPage={setPage} />
            </>
          ) : <EmptyState title="No students found" description="Create students or adjust your search." />}
        </section>
        <StudentPanel student={active} onAssign={() => setModal("card")} onGuardian={() => setModal("guardian")} />
      </div>
      {modal === "student" ? <StudentModal onClose={() => setModal(null)} onSaved={students.reload} /> : null}
      {modal === "edit" && active ? <StudentModal student={active} onClose={() => setModal(null)} onSaved={students.reload} /> : null}
      {modal === "card" && active ? <CardModal student={active} onClose={() => setModal(null)} onSaved={students.reload} /> : null}
      {modal === "guardian" && active ? <GuardianModal student={active} onClose={() => setModal(null)} /> : null}
    </DashboardShell>
  );
}

function Pagination({ pagination, page, setPage }) {
  if (!pagination) return null;
  return (
    <div className="flex items-center justify-between border-t border-outline-variant p-3 text-sm text-on-surface-variant">
      <span>Page {pagination.page} of {pagination.totalPages || 1} · {pagination.total || 0} students</span>
      <div className="flex gap-2">
        <button className="btn-secondary px-3 py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <button className="btn-secondary px-3 py-1" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

function StudentPanel({ student, onAssign, onGuardian }) {
  if (!student) return <aside className="panel"><EmptyState title="Select a student" description="Student details and ID preview will show here." /></aside>;
  return (
    <aside className="panel overflow-hidden">
      <div className="bg-surface-container-low p-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-xl font-bold text-on-primary-fixed">{student.name?.slice(0, 2).toUpperCase()}</div>
        <h3 className="mt-3 font-display text-lg font-semibold">{student.name}</h3>
        <p className="font-mono text-xs text-on-surface-variant">ID: {student.admissionNumber}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button className="btn-secondary px-3 py-1.5" onClick={onAssign}>Assign Tag</button>
          <button className="btn-secondary px-3 py-1.5" onClick={onGuardian}>Guardian</button>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <Info label="Class" value={student.class} />
        <Info label="Status" value={<StatusBadge value={student.status} />} />
        <div>
          <p className="label mb-2">Digital ID Preview</p>
          <div className="relative overflow-hidden rounded-lg bg-slate-950 p-4 text-white">
            <div className="border-b border-white/10 pb-2">
              <p className="text-xs text-white/70">SmartTrack Academy</p>
              <p className="text-sm font-bold">Student ID</p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded border border-white/20 bg-white/10 text-sm font-bold">{student.name?.slice(0, 2).toUpperCase()}</div>
              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="font-mono text-xs text-white/70">{student.admissionNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Info({ label, value }) {
  return <div><p className="label">{label}</p><div className="mt-1 text-sm text-on-surface">{value}</div></div>;
}

function StudentModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({ name: student?.name || "", class: student?.class || "", admissionNumber: student?.admissionNumber || "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      student ? await studentsService.update(student.id, form) : await studentsService.create(form);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return <Modal title={student ? "Edit student" : "Add student"} onClose={onClose}><form className="space-y-4" onSubmit={submit}>{["name", "class", "admissionNumber"].map((field) => <label className="block" key={field}><span className="label">{field === "admissionNumber" ? "Admission number" : field}</span><input className="field mt-1" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required /></label>)}{error ? <p className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">{error}</p> : null}<button className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save student"}</button></form></Modal>;
}

function CardModal({ student, onClose, onSaved }) {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      await cardsService.assign({ studentId: student.id, uid });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }
  return <Modal title={`Assign card to ${student.name}`} onClose={onClose}><form onSubmit={submit} className="space-y-4"><label className="block"><span className="label">Card UID</span><input className="field mt-1 font-mono" value={uid} onChange={(e) => setUid(e.target.value)} required /></label>{error ? <p className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">{error}</p> : null}<button className="btn-primary">Assign card</button></form></Modal>;
}

function GuardianModal({ student, onClose }) {
  const [form, setForm] = useState({ name: "", phoneNumber: "", notificationPreference: "sms", relationship: "Parent" });
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      const data = await guardiansService.create({ name: form.name, phoneNumber: form.phoneNumber, notificationPreference: form.notificationPreference });
      await guardiansService.attachStudent(data.guardian.id, { studentId: student.id, relationship: form.relationship });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }
  return <Modal title={`Attach guardian to ${student.name}`} onClose={onClose}><form onSubmit={submit} className="space-y-4">{["name", "phoneNumber", "relationship"].map((field) => <label className="block" key={field}><span className="label">{field}</span><input className="field mt-1" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required /></label>)}{error ? <p className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">{error}</p> : null}<button className="btn-primary">Create and attach</button></form></Modal>;
}
