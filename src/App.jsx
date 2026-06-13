import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  BriefcaseBusiness,
  Download,
  GripVertical,
  Link as LinkIcon,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { clearAllJobs, deleteJobById, getAllJobs, upsertJob } from './lib/db'

const STATUS_COLUMNS = [
  { key: 'wishlist', label: 'Wishlist', accent: 'border-sky-500' },
  { key: 'applied', label: 'Applied', accent: 'border-blue-500' },
  { key: 'follow-up', label: 'Follow-up', accent: 'border-amber-500' },
  { key: 'interview', label: 'Interview', accent: 'border-violet-500' },
  { key: 'offer', label: 'Offer', accent: 'border-emerald-500' },
  { key: 'rejected', label: 'Rejected', accent: 'border-rose-500' },
]

const COMMON_RESUMES = ['SDE_Resume_v3', 'QA_Lead_Resume', 'Product_Resume_v2']

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Applied' },
  { value: 'oldest', label: 'Oldest Applied' },
]

const emptyForm = {
  company: '',
  role: '',
  linkedinUrl: '',
  resumeName: '',
  dateApplied: new Date().toISOString().slice(0, 10),
  salaryRange: '',
  notes: '',
  status: 'wishlist',
}

const dayMs = 24 * 60 * 60 * 1000

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function formatDaysSince(dateApplied) {
  const appliedTime = new Date(dateApplied).getTime()
  if (Number.isNaN(appliedTime)) {
    return 'Unknown date'
  }
  const diff = Math.max(0, Math.floor((Date.now() - appliedTime) / dayMs))
  if (diff === 0) {
    return 'Applied today'
  }
  if (diff === 1) {
    return '1 day ago'
  }
  return `${diff} days ago`
}

function columnId(status) {
  return `column:${status}`
}

function createJobFromForm(form, previousJob) {
  const now = new Date().toISOString()
  return {
    id: previousJob?.id ?? crypto.randomUUID(),
    company: form.company.trim(),
    role: form.role.trim(),
    linkedinUrl: form.linkedinUrl.trim(),
    resumeName: form.resumeName.trim(),
    dateApplied: form.dateApplied,
    salaryRange: form.salaryRange.trim(),
    notes: form.notes.trim(),
    status: form.status,
    createdAt: previousJob?.createdAt ?? now,
    updatedAt: now,
  }
}

function JobCard({ job, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { status: job.status },
  })

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx(
        'mb-3 rounded-xl border border-l-4 bg-[var(--bg-card)] p-3 shadow-sm transition',
        STATUS_COLUMNS.find((column) => column.key === job.status)?.accent,
        isDragging && 'opacity-40 shadow-lg',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold leading-tight">{job.company}</p>
          <p className="text-sm text-[var(--text-soft)]">{job.role}</p>
        </div>
        <button
          type="button"
          aria-label="Drag card"
          className="rounded-md p-1 text-[var(--text-soft)] hover:bg-[var(--bg-muted)]"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={16} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {job.resumeName ? (
          <span className="rounded-full bg-[var(--bg-muted)] px-2 py-1 font-medium">
            {job.resumeName}
          </span>
        ) : null}
        <span className="rounded-full bg-[var(--bg-muted)] px-2 py-1 text-[var(--text-soft)]">
          {formatDaysSince(job.dateApplied)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <a
          href={job.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          <LinkIcon size={14} />
          LinkedIn
        </a>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="rounded-md p-1 text-[var(--text-soft)] hover:bg-[var(--bg-muted)]"
            aria-label="Edit job"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(job)}
            className="rounded-md p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950"
            aria-label="Delete job"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

function Column({ status, label, jobs, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId(status) })

  return (
    <section className="glass flex min-h-[520px] min-w-[280px] flex-1 flex-col rounded-2xl p-3">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-soft)]">
          {label}
        </h3>
        <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-semibold">
          {jobs.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={clsx(
          'column-scroll overflow-y-auto rounded-xl p-1',
          isOver && 'bg-blue-100/70 dark:bg-blue-900/40',
        )}
      >
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-soft)]">
            Drop jobs here
          </p>
        ) : null}
      </div>
    </section>
  )
}

function JobFormModal({ open, form, setForm, resumes, onClose, onSave, title, errors }) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="glass w-full max-w-2xl rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--text-soft)] hover:bg-[var(--bg-muted)]"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSave}
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <label className="text-sm font-medium">
            Company name*
            <input
              value={form.company}
              onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            />
            {errors.company ? <span className="text-xs text-rose-500">{errors.company}</span> : null}
          </label>

          <label className="text-sm font-medium">
            Job title / role*
            <input
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            />
            {errors.role ? <span className="text-xs text-rose-500">{errors.role}</span> : null}
          </label>

          <label className="text-sm font-medium md:col-span-2">
            LinkedIn job URL*
            <input
              value={form.linkedinUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
              placeholder="https://www.linkedin.com/jobs/view/..."
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            />
            {errors.linkedinUrl ? <span className="text-xs text-rose-500">{errors.linkedinUrl}</span> : null}
          </label>

          <label className="text-sm font-medium">
            Resume used
            <input
              list="resume-options"
              value={form.resumeName}
              onChange={(event) => setForm((prev) => ({ ...prev, resumeName: event.target.value }))}
              placeholder="SDE_Resume_v3"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            />
            <datalist id="resume-options">
              {resumes.map((resume) => (
                <option key={resume} value={resume} />
              ))}
            </datalist>
          </label>

          <label className="text-sm font-medium">
            Date applied
            <input
              type="date"
              value={form.dateApplied}
              onChange={(event) => setForm((prev) => ({ ...prev, dateApplied: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium">
            Salary range
            <input
              value={form.salaryRange}
              onChange={(event) => setForm((prev) => ({ ...prev, salaryRange: event.target.value }))}
              placeholder="₹25-30 LPA"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium">
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            >
              {STATUS_COLUMNS.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Recruiter info, referral notes..."
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            />
          </label>

          <div className="mt-3 flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save Job
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function App() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState('newest')
  const [activeJobId, setActiveJobId] = useState(null)

  const [openForm, setOpenForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})

  const [theme, setTheme] = useState(() => localStorage.getItem('job-tracker-theme') || 'light')
  const importInputRef = useRef(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    const loadJobs = async () => {
      const data = await getAllJobs()
      setJobs(data)
    }
    loadJobs()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('job-tracker-theme', theme)
  }, [theme])

  const resumeOptions = useMemo(() => {
    const set = new Set(COMMON_RESUMES)
    jobs.forEach((job) => {
      if (job.resumeName) {
        set.add(job.resumeName)
      }
    })
    return Array.from(set)
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    const items = query
      ? jobs.filter(
          (job) =>
            job.company.toLowerCase().includes(query) ||
            job.role.toLowerCase().includes(query),
        )
      : jobs

    return [...items].sort((a, b) => {
      const aTime = new Date(a.dateApplied).getTime()
      const bTime = new Date(b.dateApplied).getTime()
      if (sortMode === 'oldest') {
        return aTime - bTime
      }
      return bTime - aTime
    })
  }, [jobs, search, sortMode])

  const jobsByColumn = useMemo(() => {
    const grouped = Object.fromEntries(STATUS_COLUMNS.map((column) => [column.key, []]))
    filteredJobs.forEach((job) => {
      grouped[job.status]?.push(job)
    })
    return grouped
  }, [filteredJobs])

  const openCreateForm = () => {
    setEditingJob(null)
    setFormErrors({})
    setFormData({ ...emptyForm, dateApplied: new Date().toISOString().slice(0, 10) })
    setOpenForm(true)
  }

  const openEditForm = (job) => {
    setEditingJob(job)
    setFormErrors({})
    setFormData({
      company: job.company,
      role: job.role,
      linkedinUrl: job.linkedinUrl,
      resumeName: job.resumeName,
      dateApplied: job.dateApplied,
      salaryRange: job.salaryRange,
      notes: job.notes,
      status: job.status,
    })
    setOpenForm(true)
  }

  const saveForm = async (event) => {
    event.preventDefault()
    const errors = {}

    if (!formData.company.trim()) {
      errors.company = 'Company name is required.'
    }
    if (!formData.role.trim()) {
      errors.role = 'Job role is required.'
    }
    if (!formData.linkedinUrl.trim()) {
      errors.linkedinUrl = 'LinkedIn URL is required.'
    } else if (!isValidUrl(formData.linkedinUrl.trim())) {
      errors.linkedinUrl = 'Enter a valid URL.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const nextJob = createJobFromForm(formData, editingJob)
    await upsertJob(nextJob)
    setJobs((prev) => {
      const index = prev.findIndex((item) => item.id === nextJob.id)
      if (index === -1) {
        return [nextJob, ...prev]
      }
      const clone = [...prev]
      clone[index] = nextJob
      return clone
    })

    setOpenForm(false)
    setEditingJob(null)
  }

  const deleteJob = async (job) => {
    const confirmed = window.confirm(`Delete job for ${job.company} - ${job.role}?`)
    if (!confirmed) {
      return
    }
    await deleteJobById(job.id)
    setJobs((prev) => prev.filter((item) => item.id !== job.id))
  }

  const handleDragStart = (event) => {
    setActiveJobId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    setActiveJobId(null)
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const activeJob = jobs.find((job) => job.id === active.id)
    if (!activeJob) {
      return
    }

    const overId = String(over.id)
    if (!overId.startsWith('column:')) {
      return
    }

    const nextStatus = overId.split(':')[1]
    if (nextStatus === activeJob.status) {
      return
    }

    const movedJob = {
      ...activeJob,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    }
    await upsertJob(movedJob)
    setJobs((prev) => prev.map((job) => (job.id === movedJob.id ? movedJob : job)))
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const importJson = async (event) => {
    const [file] = event.target.files || []
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        throw new Error('Expected an array of job cards.')
      }

      const sanitized = parsed
        .filter((item) => item.company && item.role && item.linkedinUrl)
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          company: String(item.company),
          role: String(item.role),
          linkedinUrl: String(item.linkedinUrl),
          resumeName: String(item.resumeName || ''),
          dateApplied: String(item.dateApplied || new Date().toISOString().slice(0, 10)),
          salaryRange: String(item.salaryRange || ''),
          notes: String(item.notes || ''),
          status: STATUS_COLUMNS.some((column) => column.key === item.status)
            ? item.status
            : 'wishlist',
          createdAt: String(item.createdAt || new Date().toISOString()),
          updatedAt: String(item.updatedAt || new Date().toISOString()),
        }))

      const clearConfirmed = window.confirm(
        'Import will replace existing jobs. Continue?',
      )
      if (!clearConfirmed) {
        return
      }

      await clearAllJobs()
      await Promise.all(sanitized.map((job) => upsertJob(job)))
      setJobs(sanitized)
    } catch (error) {
      window.alert(`Import failed: ${error.message}`)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="app-shell p-4 md:p-6">
      <section className="mx-auto max-w-[1600px]">
        <header className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-[var(--bg-muted)] p-2">
                <BriefcaseBusiness size={20} />
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">Local Job Tracker</h1>
                <p className="text-sm text-[var(--text-soft)]">IndexedDB-first job search board</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark' : 'Light'}
              </button>

              <button
                type="button"
                onClick={exportJson}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium"
              >
                <Download size={16} />
                Export
              </button>

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium"
              >
                <Upload size={16} />
                Import
              </button>
              <input
                ref={importInputRef}
                onChange={importJson}
                type="file"
                accept="application/json"
                className="hidden"
              />

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Job
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by company or role"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              Sort:
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 xl:grid-cols-6">
            {STATUS_COLUMNS.map((column) => (
              <Column
                key={column.key}
                status={column.key}
                label={column.label}
                jobs={jobsByColumn[column.key] || []}
                onEdit={openEditForm}
                onDelete={deleteJob}
              />
            ))}
          </div>
        </DndContext>
      </section>

      <JobFormModal
        open={openForm}
        form={formData}
        setForm={setFormData}
        resumes={resumeOptions}
        onClose={() => {
          setOpenForm(false)
          setEditingJob(null)
          setFormErrors({})
        }}
        onSave={saveForm}
        title={editingJob ? `Edit ${editingJob.company}` : 'Add New Job'}
        errors={formErrors}
      />

      {activeJobId ? (
        <p className="fixed bottom-3 right-3 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
          Dragging card...
        </p>
      ) : null}

      <footer className="mt-4 text-center text-xs text-[var(--text-soft)]">
        Jobs are stored only in your browser via IndexedDB.
      </footer>
    </main>
  )
}

export default App
