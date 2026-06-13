import React, { useEffect, useState, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  getSurveyReadings, createSurveyReading, updateSurveyReading, deleteSurveyReading,
  setSurveyReadingProblems, getProblems
} from '../api';
import { toast } from 'react-toastify';
import { PageHeader, Card, Badge, EmptyState, ConfirmModal } from '../components/Shared';

const STATUS_COLORS = {
  to_read: '#6b7280', reading: '#f59e0b', done: '#10b981', revisit: '#8b5cf6',
};
const STATUS_LABELS = {
  to_read: 'To Read', reading: 'Reading', done: 'Done', revisit: 'Revisit'
};

const EMPTY_FORM = {
  title: '', authors: '', year: '', source: '', url_or_doi: '',
  status: 'to_read', date_read: '',
  domain_covered: '', taxonomy: '', papers_covered_count: '',
  time_span_covered: '', problem_landscape: '', existing_solutions: '',
  open_challenges: '', future_directions: '', benchmark_datasets: '',
  key_papers_to_read: '', relevance_to_my_work: '', personal_notes: '',
};

function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontStyle: 'italic' }}>{hint}</div>}
      {children}
    </div>
  );
}

function SectionDivider({ title }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 6, marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 2 }}>{title}</div>
    </div>
  );
}

export default function SurveyReadings() {
  const { activeProject } = useProject();
  const pid = activeProject?.id;

  const [readings, setReadings] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const [rRes, pRes] = await Promise.all([
        getSurveyReadings(pid, params),
        getProblems(pid)
      ]);
      setReadings(rRes.data);
      setProblems(pRes.data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  }, [pid, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null); setForm(EMPTY_FORM); setSelectedProblems([]); setShowForm(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    const mapped = {};
    Object.keys(EMPTY_FORM).forEach(k => { mapped[k] = r[k] !== null && r[k] !== undefined ? String(r[k]) : ''; });
    setForm(mapped);
    setSelectedProblems(r.related_problems_titles ? r.related_problems_titles.map(p => p.id) : []);
    setShowForm(true);
  };

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.papers_covered_count === '') payload.papers_covered_count = null;
      else if (payload.papers_covered_count) payload.papers_covered_count = parseInt(payload.papers_covered_count);

      let saved;
      if (editing) {
        const res = await updateSurveyReading(pid, editing.id, payload);
        saved = res.data;
      } else {
        const res = await createSurveyReading(pid, payload);
        saved = res.data;
      }
      await setSurveyReadingProblems(pid, saved.id, { problem_ids: selectedProblems });
      toast.success(editing ? 'Updated!' : 'Added!');
      setShowForm(false);
      load();
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (r) => {
    try {
      await deleteSurveyReading(pid, r.id);
      toast.success('Deleted');
      setReadings(prev => prev.filter(x => x.id !== r.id));
    } catch { toast.error('Delete failed'); }
    setConfirmDelete(null);
  };

  const toggleProblem = (id) => {
    setSelectedProblems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const stats = {
    total: readings.length,
    done: readings.filter(r => r.status === 'done').length,
    reading: readings.filter(r => r.status === 'reading').length,
  };

  if (!pid) return <EmptyState message="Select a project first" />;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader
        title="Survey Paper Tracker"
        subtitle="Track your reading of survey and review papers — understand the field landscape, open challenges, and future directions"
        action={<button className="btn-primary" onClick={openNew}>+ Add Survey</button>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Surveys', value: stats.total, color: 'var(--teal)' },
          { label: 'Done', value: stats.done, color: '#10b981' },
          { label: 'Reading', value: stats.reading, color: '#f59e0b' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center', padding: '14px 10px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search title / author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 130 }}>
          <option value="">All Status</option>
          <option value="to_read">To Read</option>
          <option value="reading">Reading</option>
          <option value="done">Done</option>
          <option value="revisit">Revisit</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : readings.length === 0 ? (
        <EmptyState message="No survey readings yet. Add your first survey paper!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {readings.map(r => (
            <Card key={r.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text0)', fontSize: 14 }}>{r.title}</span>
                    <Badge color={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                    <Badge color="var(--teal)" textColor="#0a0c10">Survey</Badge>
                    {r.papers_covered_count && (
                      <Badge color="var(--bg4)" textColor="var(--text2)">{r.papers_covered_count} papers</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
                    {r.authors && <span>{r.authors}</span>}
                    {r.year && <span style={{ marginLeft: 6 }}>({r.year})</span>}
                    {r.source && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>{r.source}</span>}
                    {r.time_span_covered && <span style={{ marginLeft: 8, color: 'var(--teal)' }}>Covers: {r.time_span_covered}</span>}
                    {r.date_read && <span style={{ marginLeft: 8, color: 'var(--green)' }}>Read: {r.date_read}</span>}
                  </div>
                  {r.related_problems_titles && r.related_problems_titles.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                      {r.related_problems_titles.map(p => (
                        <Badge key={p.id} color="var(--gold)" textColor="#0a0c10" style={{ fontSize: 10 }}>
                          📌 {p.title.length > 40 ? p.title.slice(0, 40) + '…' : p.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {expandedId !== r.id && r.domain_covered && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', borderLeft: '3px solid var(--teal)', paddingLeft: 8 }}>
                      <span style={{ color: 'var(--text3)' }}>Domain: </span>{r.domain_covered.slice(0, 120)}{r.domain_covered.length > 120 ? '…' : ''}
                    </div>
                  )}
                  {expandedId === r.id && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: '🌐 Domain / Subfield Covered', value: r.domain_covered },
                        { label: '🗂 Taxonomy / Classification Scheme', value: r.taxonomy },
                        { label: '🔍 Problem Landscape in This Field', value: r.problem_landscape },
                        { label: '💡 Existing Solutions / Approaches', value: r.existing_solutions },
                        { label: '🚧 Open Challenges & Research Gaps', value: r.open_challenges },
                        { label: '🔭 Future Research Directions', value: r.future_directions },
                        { label: '📊 Standard Datasets & Benchmarks', value: r.benchmark_datasets },
                        { label: '📚 Key Papers to Read Next', value: r.key_papers_to_read },
                        { label: '🛠 Relevance to My Work', value: r.relevance_to_my_work },
                        { label: '📝 Personal Notes', value: r.personal_notes },
                      ].filter(x => x.value).map(x => (
                        <div key={x.label}>
                          <div style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{x.label}</div>
                          <div style={{ fontSize: 13, color: 'var(--text1)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{x.value}</div>
                        </div>
                      ))}
                      {r.url_or_doi && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>URL / DOI</div>
                          <a href={r.url_or_doi.startsWith('http') ? r.url_or_doi : `https://doi.org/${r.url_or_doi}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 13, color: 'var(--teal)' }}>{r.url_or_doi}</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                  <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                    {expandedId === r.id ? 'Collapse ▲' : 'Expand ▼'}
                  </button>
                  <button onClick={() => openEdit(r)}
                    style={{ fontSize: 11, color: 'var(--teal)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => setConfirmDelete(r)}
                    style={{ fontSize: 11, color: 'var(--red)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 720, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text0)', marginBottom: 20 }}>
              {editing ? 'Edit Survey Reading' : 'Add Survey Paper'}
            </div>

            <SectionDivider title="Survey Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Title *">
                  <input value={form.title} onChange={f('title')} placeholder="Survey paper title" autoFocus />
                </FormField>
              </div>
              <FormField label="Authors">
                <input value={form.authors} onChange={f('authors')} placeholder="Author names" />
              </FormField>
              <FormField label="Year">
                <input value={form.year} onChange={f('year')} placeholder="2024" />
              </FormField>
              <FormField label="Source (Journal / Conference)">
                <input value={form.source} onChange={f('source')} placeholder="e.g. ACM Computing Surveys" />
              </FormField>
              <FormField label="URL / DOI">
                <input value={form.url_or_doi} onChange={f('url_or_doi')} placeholder="https://... or DOI" />
              </FormField>
              <FormField label="Reading Status">
                <select value={form.status} onChange={f('status')}>
                  <option value="to_read">To Read</option>
                  <option value="reading">Currently Reading</option>
                  <option value="done">Done</option>
                  <option value="revisit">Needs Revisit</option>
                </select>
              </FormField>
              <FormField label="Date Read">
                <input type="date" value={form.date_read} onChange={f('date_read')} />
              </FormField>
              <FormField label="Number of Papers Covered">
                <input type="number" value={form.papers_covered_count} onChange={f('papers_covered_count')} placeholder="e.g. 150" min="0" />
              </FormField>
              <FormField label="Time Span Covered">
                <input value={form.time_span_covered} onChange={f('time_span_covered')} placeholder="e.g. 2010–2024" />
              </FormField>
            </div>

            <SectionDivider title="Link to Problem Definitions" />
            {problems.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 14 }}>No problems defined yet.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {problems.map(p => (
                  <button key={p.id} onClick={() => toggleProblem(p.id)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      background: selectedProblems.includes(p.id) ? 'var(--teal)' : 'var(--bg3)',
                      color: selectedProblems.includes(p.id) ? '#0a0c10' : 'var(--text2)',
                      border: selectedProblems.includes(p.id) ? '1px solid var(--teal)' : '1px solid var(--border)',
                      fontWeight: selectedProblems.includes(p.id) ? 700 : 400,
                    }}>
                    {p.title.length > 50 ? p.title.slice(0, 50) + '…' : p.title}
                  </button>
                ))}
              </div>
            )}

            <SectionDivider title="Field Overview" />
            <FormField label="Domain / Subfield Covered" hint="What area of research does this survey cover?">
              <textarea value={form.domain_covered} onChange={f('domain_covered')} rows={2} placeholder="e.g. Deep learning for medical image segmentation" />
            </FormField>
            <FormField label="Taxonomy / Classification Scheme" hint="How does the survey organise / categorise the field?">
              <textarea value={form.taxonomy} onChange={f('taxonomy')} rows={3} placeholder="How does the survey categorise methods and approaches?" />
            </FormField>
            <FormField label="Problem Landscape in This Field" hint="What problems exist across this field?">
              <textarea value={form.problem_landscape} onChange={f('problem_landscape')} rows={3} placeholder="What key problems does this field try to solve?" />
            </FormField>
            <FormField label="Existing Solutions / Approaches">
              <textarea value={form.existing_solutions} onChange={f('existing_solutions')} rows={3} placeholder="Main approaches and methodologies covered..." />
            </FormField>

            <SectionDivider title="Research Gaps" />
            <FormField label="Open Challenges & Research Gaps" hint="What does this survey say is still unsolved or needs more work?">
              <textarea value={form.open_challenges} onChange={f('open_challenges')} rows={3} placeholder="Unsolved problems, limitations, open questions..." />
            </FormField>
            <FormField label="Future Research Directions">
              <textarea value={form.future_directions} onChange={f('future_directions')} rows={2} placeholder="What future work does the survey suggest?" />
            </FormField>
            <FormField label="Standard Datasets & Benchmarks in This Field">
              <textarea value={form.benchmark_datasets} onChange={f('benchmark_datasets')} rows={2} placeholder="Common datasets and evaluation benchmarks..." />
            </FormField>

            <SectionDivider title="Your Analysis" />
            <FormField label="Key Papers to Read Next">
              <textarea value={form.key_papers_to_read} onChange={f('key_papers_to_read')} rows={2} placeholder="Important individual papers referenced in this survey..." />
            </FormField>
            <FormField label="Relevance to My Work">
              <textarea value={form.relevance_to_my_work} onChange={f('relevance_to_my_work')} rows={2} placeholder="How does this survey help your own research?" />
            </FormField>
            <FormField label="Personal Notes">
              <textarea value={form.personal_notes} onChange={f('personal_notes')} rows={2} placeholder="Any other observations..." />
            </FormField>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : (editing ? 'Update' : 'Save')}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Delete survey reading for "${confirmDelete.title}"?`}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
