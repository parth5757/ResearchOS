import React, { useEffect, useState, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  getPaperReadings, createPaperReading, updatePaperReading, deletePaperReading,
  setPaperReadingProblems, getProblems
} from '../api';
import { toast } from 'react-toastify';
import { PageHeader, Card, Badge, EmptyState, ConfirmModal } from '../components/Shared';

const STATUS_COLORS = {
  to_read: '#6b7280',
  reading: '#f59e0b',
  done: '#10b981',
  revisit: '#8b5cf6',
};
const STATUS_LABELS = {
  to_read: 'To Read', reading: 'Reading', done: 'Done', revisit: 'Revisit'
};
const TYPE_LABELS = {
  research: 'Research', survey: 'Survey', review: 'Review',
  conference: 'Conference', preprint: 'Preprint', book_chapter: 'Book Chapter'
};

const EMPTY_FORM = {
  title: '', authors: '', year: '', source: '', paper_type: 'research',
  url_or_doi: '', status: 'to_read', date_read: '',
  problem_addressed: '', solutions_found: '', key_contributions: '',
  datasets_used: '', results_summary: '', unsolved_issues: '',
  future_work: '', my_critique: '', how_it_helps_me: '',
  important_references: '', personal_notes: '',
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
      <div style={{ fontSize: 11, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 2 }}>{title}</div>
    </div>
  );
}

export default function PaperReadings() {
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
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.paper_type = filterType;
      if (search) params.search = search;
      const [rRes, pRes] = await Promise.all([
        getPaperReadings(pid, params),
        getProblems(pid)
      ]);
      setReadings(rRes.data);
      setProblems(pRes.data);
    } catch { toast.error('Failed to load readings'); }
    setLoading(false);
  }, [pid, filterStatus, filterType, search]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null); setForm(EMPTY_FORM); setSelectedProblems([]); setShowForm(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      title: r.title || '', authors: r.authors || '', year: r.year || '',
      source: r.source || '', paper_type: r.paper_type || 'research',
      url_or_doi: r.url_or_doi || '', status: r.status || 'to_read',
      date_read: r.date_read || '',
      problem_addressed: r.problem_addressed || '',
      solutions_found: r.solutions_found || '',
      key_contributions: r.key_contributions || '',
      datasets_used: r.datasets_used || '',
      results_summary: r.results_summary || '',
      unsolved_issues: r.unsolved_issues || '',
      future_work: r.future_work || '',
      my_critique: r.my_critique || '',
      how_it_helps_me: r.how_it_helps_me || '',
      important_references: r.important_references || '',
      personal_notes: r.personal_notes || '',
    });
    setSelectedProblems(r.related_problems_titles ? r.related_problems_titles.map(p => p.id) : []);
    setShowForm(true);
  };

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      let saved;
      if (editing) {
        const res = await updatePaperReading(pid, editing.id, form);
        saved = res.data;
      } else {
        const res = await createPaperReading(pid, form);
        saved = res.data;
      }
      // set problem links
      await setPaperReadingProblems(pid, saved.id, { problem_ids: selectedProblems });
      toast.success(editing ? 'Updated!' : 'Added!');
      setShowForm(false);
      load();
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (r) => {
    try {
      await deletePaperReading(pid, r.id);
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
    toRead: readings.filter(r => r.status === 'to_read').length,
  };

  if (!pid) return <EmptyState message="Select a project first" />;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader
        title="Paper Reading Tracker"
        subtitle="Record what you learn from each research paper — problems addressed, solutions found, gaps remaining"
        action={<button className="btn-primary" onClick={openNew}>+ Add Paper</button>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--gold2)' },
          { label: 'Done', value: stats.done, color: '#10b981' },
          { label: 'Reading', value: stats.reading, color: '#f59e0b' },
          { label: 'To Read', value: stats.toRead, color: 'var(--text3)' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center', padding: '14px 10px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Search title / author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 130 }}>
          <option value="">All Status</option>
          <option value="to_read">To Read</option>
          <option value="reading">Reading</option>
          <option value="done">Done</option>
          <option value="revisit">Revisit</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: 150 }}>
          <option value="">All Types</option>
          <option value="research">Research</option>
          <option value="survey">Survey</option>
          <option value="conference">Conference</option>
          <option value="preprint">Preprint</option>
          <option value="review">Review</option>
          <option value="book_chapter">Book Chapter</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : readings.length === 0 ? (
        <EmptyState message="No readings yet. Add your first paper to start tracking!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {readings.map(r => (
            <Card key={r.id} style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text0)', fontSize: 14 }}>{r.title}</span>
                    <Badge color={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                    <Badge color="var(--bg4)" textColor="var(--text2)">{TYPE_LABELS[r.paper_type] || r.paper_type}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
                    {r.authors && <span>{r.authors}</span>}
                    {r.year && <span style={{ marginLeft: 6 }}>({r.year})</span>}
                    {r.source && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>{r.source}</span>}
                    {r.date_read && <span style={{ marginLeft: 8, color: 'var(--teal)' }}>Read: {r.date_read}</span>}
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
                  {/* Quick summary if collapsed */}
                  {expandedId !== r.id && r.problem_addressed && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', borderLeft: '3px solid var(--border2)', paddingLeft: 8 }}>
                      <span style={{ color: 'var(--text3)' }}>Problem: </span>{r.problem_addressed.slice(0, 120)}{r.problem_addressed.length > 120 ? '…' : ''}
                    </div>
                  )}
                  {/* Expanded details */}
                  {expandedId === r.id && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: '🎯 Problem Addressed', value: r.problem_addressed },
                        { label: '💡 Solutions Found', value: r.solutions_found },
                        { label: '🔑 Key Contributions', value: r.key_contributions },
                        { label: '📊 Datasets Used', value: r.datasets_used },
                        { label: '📈 Results Summary', value: r.results_summary },
                        { label: '❓ Unsolved Issues / Limitations', value: r.unsolved_issues },
                        { label: '🔭 Future Work', value: r.future_work },
                        { label: '🧪 My Critique', value: r.my_critique },
                        { label: '🛠 How It Helps My Research', value: r.how_it_helps_me },
                        { label: '📚 Important References to Follow Up', value: r.important_references },
                        { label: '📝 Personal Notes', value: r.personal_notes },
                      ].filter(x => x.value).map(x => (
                        <div key={x.label}>
                          <div style={{ fontSize: 11, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{x.label}</div>
                          <div style={{ fontSize: 13, color: 'var(--text1)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{x.value}</div>
                        </div>
                      ))}
                      {r.url_or_doi && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>URL / DOI</div>
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
                    style={{ fontSize: 11, color: 'var(--gold2)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
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
              {editing ? 'Edit Paper Reading' : 'Add Paper Reading'}
            </div>

            <SectionDivider title="Paper Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Title *">
                <input value={form.title} onChange={f('title')} placeholder="Paper title" autoFocus />
              </FormField>
              <FormField label="Paper Type">
                <select value={form.paper_type} onChange={f('paper_type')}>
                  <option value="research">Research Paper</option>
                  <option value="survey">Survey Paper</option>
                  <option value="review">Review Article</option>
                  <option value="conference">Conference Paper</option>
                  <option value="preprint">Preprint / arXiv</option>
                  <option value="book_chapter">Book Chapter</option>
                </select>
              </FormField>
              <FormField label="Authors">
                <input value={form.authors} onChange={f('authors')} placeholder="Author names" />
              </FormField>
              <FormField label="Year">
                <input value={form.year} onChange={f('year')} placeholder="2024" />
              </FormField>
              <FormField label="Source (Journal / Conference)">
                <input value={form.source} onChange={f('source')} placeholder="e.g. NeurIPS 2024, IEEE TPAMI" />
              </FormField>
              <FormField label="URL / DOI">
                <input value={form.url_or_doi} onChange={f('url_or_doi')} placeholder="https://... or 10.xxxx/..." />
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
            </div>

            <SectionDivider title="Link to Problem Definitions" />
            {problems.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 14 }}>No problems defined yet. Add problems in Problem Definition section.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {problems.map(p => (
                  <button key={p.id} onClick={() => toggleProblem(p.id)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      background: selectedProblems.includes(p.id) ? 'var(--gold)' : 'var(--bg3)',
                      color: selectedProblems.includes(p.id) ? '#0a0c10' : 'var(--text2)',
                      border: selectedProblems.includes(p.id) ? '1px solid var(--gold)' : '1px solid var(--border)',
                      fontWeight: selectedProblems.includes(p.id) ? 700 : 400,
                    }}>
                    {p.title.length > 50 ? p.title.slice(0, 50) + '…' : p.title}
                  </button>
                ))}
              </div>
            )}

            <SectionDivider title="Research Analysis" />
            <FormField label="Problem Addressed" hint="What specific research problem does this paper tackle?">
              <textarea value={form.problem_addressed} onChange={f('problem_addressed')} rows={3} placeholder="What problem does this paper address?" />
            </FormField>
            <FormField label="Solutions / Methods Found" hint="What approach, method or solution does the paper propose?">
              <textarea value={form.solutions_found} onChange={f('solutions_found')} rows={3} placeholder="Describe the main solution or methodology..." />
            </FormField>
            <FormField label="Key Contributions">
              <textarea value={form.key_contributions} onChange={f('key_contributions')} rows={2} placeholder="List the main contributions..." />
            </FormField>
            <FormField label="Datasets / Benchmarks Used">
              <textarea value={form.datasets_used} onChange={f('datasets_used')} rows={2} placeholder="What datasets, benchmarks, or experimental setups did they use?" />
            </FormField>
            <FormField label="Results Summary">
              <textarea value={form.results_summary} onChange={f('results_summary')} rows={2} placeholder="Key metrics and results achieved..." />
            </FormField>

            <SectionDivider title="Gaps & Future Directions" />
            <FormField label="Unsolved Issues / Limitations" hint="What problems remain unsolved? What are the paper's weaknesses?">
              <textarea value={form.unsolved_issues} onChange={f('unsolved_issues')} rows={3} placeholder="Limitations, unsolved challenges, weaknesses..." />
            </FormField>
            <FormField label="Future Work Suggested" hint="What future directions does the paper suggest?">
              <textarea value={form.future_work} onChange={f('future_work')} rows={2} placeholder="Future research directions mentioned in the paper..." />
            </FormField>

            <SectionDivider title="Your Own Analysis" />
            <FormField label="My Critique" hint="Your critical analysis — where do you disagree or see problems?">
              <textarea value={form.my_critique} onChange={f('my_critique')} rows={3} placeholder="Your critical thoughts, disagreements, questions..." />
            </FormField>
            <FormField label="How This Helps My Research">
              <textarea value={form.how_it_helps_me} onChange={f('how_it_helps_me')} rows={2} placeholder="Specifically how does this paper contribute to your own work?" />
            </FormField>
            <FormField label="Important References to Follow Up">
              <textarea value={form.important_references} onChange={f('important_references')} rows={2} placeholder="Other papers cited here that you should read next..." />
            </FormField>
            <FormField label="Personal Notes">
              <textarea value={form.personal_notes} onChange={f('personal_notes')} rows={2} placeholder="Any other notes..." />
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
          message={`Delete reading for "${confirmDelete.title}"?`}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
