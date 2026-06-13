import React, { useEffect, useState, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../api';
import { toast } from 'react-toastify';
import { PageHeader, Card, Badge, EmptyState, ConfirmModal } from '../components/Shared';

const STATUS_COLORS = {
  target: '#6b7280',
  preparing: '#f59e0b',
  submitted: '#3b82f6',
  under_review: '#8b5cf6',
  accepted: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
};
const STATUS_LABELS = {
  target: 'Target', preparing: 'Preparing', submitted: 'Submitted',
  under_review: 'Under Review', accepted: '✓ Accepted', rejected: 'Rejected', withdrawn: 'Withdrawn'
};
const TYPE_LABELS = {
  journal: 'Journal', conference: 'Conference', workshop: 'Workshop',
  symposium: 'Symposium', arxiv: 'arXiv'
};
const TYPE_COLORS = {
  journal: '#3b82f6', conference: '#f59e0b', workshop: '#8b5cf6',
  symposium: '#10b981', arxiv: '#6b7280'
};

const EMPTY_FORM = {
  name: '', abbreviation: '', venue_type: 'journal', url: '',
  publisher: '', issn_isbn: '', impact_factor: '', h_index: '',
  quartile: '', acceptance_rate: '',
  scope: '', why_suitable: '', page_limit: '', submission_format: '',
  submission_deadline: '', notification_date: '', camera_ready_date: '',
  event_date: '',
  status: 'target', submission_date: '', paper_id_received: '',
  review_notes: '', notes: '',
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

function SectionDivider({ title, color }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 6, marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: color || 'var(--gold2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 2 }}>{title}</div>
    </div>
  );
}

function DeadlineBadge({ days }) {
  if (days === null || days === undefined) return null;
  const color = days < 0 ? '#6b7280' : days <= 7 ? '#ef4444' : days <= 30 ? '#f59e0b' : '#10b981';
  const label = days < 0 ? `Passed ${Math.abs(days)}d ago` : days === 0 ? 'Today!' : `${days}d left`;
  return <Badge color={color}>{label}</Badge>;
}

export default function Venues() {
  const { activeProject } = useProject();
  const pid = activeProject?.id;

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.venue_type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const res = await getVenues(pid, params);
      setVenues(res.data);
    } catch { toast.error('Failed to load venues'); }
    setLoading(false);
  }, [pid, filterType, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true);
  };
  const openEdit = (v) => {
    setEditing(v);
    const mapped = {};
    Object.keys(EMPTY_FORM).forEach(k => { mapped[k] = v[k] !== null && v[k] !== undefined ? String(v[k]) : ''; });
    setForm(mapped);
    setShowForm(true);
  };

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Venue name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      ['submission_deadline', 'notification_date', 'camera_ready_date', 'submission_date'].forEach(k => {
        if (!payload[k]) payload[k] = null;
      });
      if (editing) {
        await updateVenue(pid, editing.id, payload);
      } else {
        await createVenue(pid, payload);
      }
      toast.success(editing ? 'Updated!' : 'Venue saved!');
      setShowForm(false);
      load();
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (v) => {
    try {
      await deleteVenue(pid, v.id);
      toast.success('Deleted');
      setVenues(prev => prev.filter(x => x.id !== v.id));
    } catch { toast.error('Delete failed'); }
    setConfirmDelete(null);
  };

  const stats = {
    total: venues.length,
    targeting: venues.filter(v => v.status === 'target').length,
    inProgress: venues.filter(v => ['preparing', 'submitted', 'under_review'].includes(v.status)).length,
    accepted: venues.filter(v => v.status === 'accepted').length,
  };

  if (!pid) return <EmptyState message="Select a project first" />;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader
        title="Publication Venues"
        subtitle="Track target journals, conferences, and workshops — deadlines, scope, impact factors, and submission status"
        action={<button className="btn-primary" onClick={openNew}>+ Add Venue</button>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Venues', value: stats.total, color: 'var(--gold2)' },
          { label: 'Targeting', value: stats.targeting, color: '#6b7280' },
          { label: 'In Progress', value: stats.inProgress, color: '#f59e0b' },
          { label: 'Accepted', value: stats.accepted, color: '#10b981' },
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
          placeholder="Search venue name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: 140 }}>
          <option value="">All Types</option>
          <option value="journal">Journal</option>
          <option value="conference">Conference</option>
          <option value="workshop">Workshop</option>
          <option value="symposium">Symposium</option>
          <option value="arxiv">arXiv</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 150 }}>
          <option value="">All Status</option>
          <option value="target">Target</option>
          <option value="preparing">Preparing</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : venues.length === 0 ? (
        <EmptyState message="No venues tracked yet. Add your first target journal or conference!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {venues.map(v => (
            <Card key={v.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text0)', fontSize: 15 }}>{v.name}</span>
                    {v.abbreviation && (
                      <span style={{ fontSize: 12, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>
                        {v.abbreviation}
                      </span>
                    )}
                    <Badge color={TYPE_COLORS[v.venue_type] || '#6b7280'}>{TYPE_LABELS[v.venue_type] || v.venue_type}</Badge>
                    <Badge color={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge>
                    <DeadlineBadge days={v.days_to_deadline} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', marginBottom: 6, flexWrap: 'wrap' }}>
                    {v.impact_factor && <span>IF: <span style={{ color: 'var(--gold2)' }}>{v.impact_factor}</span></span>}
                    {v.quartile && <span>Rank: <span style={{ color: 'var(--teal)' }}>{v.quartile}</span></span>}
                    {v.acceptance_rate && <span>Acceptance: {v.acceptance_rate}</span>}
                    {v.publisher && <span>{v.publisher}</span>}
                    {v.submission_deadline && <span>Deadline: <span style={{ color: '#f59e0b' }}>{v.submission_deadline}</span></span>}
                  </div>
                  {expandedId !== v.id && v.scope && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', borderLeft: '3px solid var(--border2)', paddingLeft: 8 }}>
                      {v.scope.slice(0, 150)}{v.scope.length > 150 ? '…' : ''}
                    </div>
                  )}
                  {expandedId === v.id && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Dates section */}
                      {(v.submission_deadline || v.notification_date || v.camera_ready_date || v.event_date) && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>📅 Important Dates</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                            {v.submission_deadline && (
                              <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>SUBMISSION DEADLINE</div>
                                <div style={{ fontSize: 13, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{v.submission_deadline}</div>
                              </div>
                            )}
                            {v.notification_date && (
                              <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>NOTIFICATION</div>
                                <div style={{ fontSize: 13, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>{v.notification_date}</div>
                              </div>
                            )}
                            {v.camera_ready_date && (
                              <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>CAMERA READY</div>
                                <div style={{ fontSize: 13, color: 'var(--gold2)', fontFamily: 'var(--font-mono)' }}>{v.camera_ready_date}</div>
                              </div>
                            )}
                            {v.event_date && (
                              <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>EVENT DATE</div>
                                <div style={{ fontSize: 13, color: 'var(--text1)', fontFamily: 'var(--font-mono)' }}>{v.event_date}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {[
                        { label: '📋 Scope & Topics', value: v.scope },
                        { label: '✅ Why Suitable for My Work', value: v.why_suitable },
                        { label: '📄 Page Limit', value: v.page_limit },
                        { label: '📝 Submission Format', value: v.submission_format },
                        { label: '🔢 ISSN / ISBN', value: v.issn_isbn },
                        { label: '📬 Submission Date', value: v.submission_date },
                        { label: '🆔 Paper ID Received', value: v.paper_id_received },
                        { label: '💬 Review Notes / Feedback', value: v.review_notes },
                        { label: '📌 Notes', value: v.notes },
                      ].filter(x => x.value).map(x => (
                        <div key={x.label}>
                          <div style={{ fontSize: 11, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{x.label}</div>
                          <div style={{ fontSize: 13, color: 'var(--text1)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{x.value}</div>
                        </div>
                      ))}
                      {v.url && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>🔗 Website</div>
                          <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--teal)' }}>{v.url}</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                  <button onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                    style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                    {expandedId === v.id ? 'Collapse ▲' : 'Expand ▼'}
                  </button>
                  <button onClick={() => openEdit(v)}
                    style={{ fontSize: 11, color: 'var(--gold2)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => setConfirmDelete(v)}
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
              {editing ? 'Edit Venue' : 'Add Publication Venue'}
            </div>

            <SectionDivider title="Venue Identity" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Venue Name *">
                  <input value={form.name} onChange={f('name')} placeholder="e.g. IEEE Transactions on Pattern Analysis and Machine Intelligence" autoFocus />
                </FormField>
              </div>
              <FormField label="Abbreviation">
                <input value={form.abbreviation} onChange={f('abbreviation')} placeholder="e.g. IEEE TPAMI, NeurIPS" />
              </FormField>
              <FormField label="Type">
                <select value={form.venue_type} onChange={f('venue_type')}>
                  <option value="journal">Journal</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="symposium">Symposium</option>
                  <option value="arxiv">arXiv / Preprint</option>
                </select>
              </FormField>
              <FormField label="Publisher">
                <input value={form.publisher} onChange={f('publisher')} placeholder="IEEE, Springer, ACM..." />
              </FormField>
              <FormField label="Website URL">
                <input value={form.url} onChange={f('url')} placeholder="https://..." />
              </FormField>
              <FormField label="ISSN / ISBN">
                <input value={form.issn_isbn} onChange={f('issn_isbn')} placeholder="e.g. 0162-8828" />
              </FormField>
            </div>

            <SectionDivider title="Quality Metrics" color="var(--teal)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <FormField label="Impact Factor">
                <input value={form.impact_factor} onChange={f('impact_factor')} placeholder="e.g. 23.6" />
              </FormField>
              <FormField label="H-Index">
                <input value={form.h_index} onChange={f('h_index')} placeholder="e.g. 250" />
              </FormField>
              <FormField label="Quartile / Rank">
                <input value={form.quartile} onChange={f('quartile')} placeholder="e.g. Q1, SCI, Scopus" />
              </FormField>
              <FormField label="Acceptance Rate">
                <input value={form.acceptance_rate} onChange={f('acceptance_rate')} placeholder="e.g. ~20%" />
              </FormField>
            </div>

            <SectionDivider title="Scope & Requirements" color="var(--teal)" />
            <FormField label="Scope / Topics Covered">
              <textarea value={form.scope} onChange={f('scope')} rows={3} placeholder="What topics / areas does this venue publish?" />
            </FormField>
            <FormField label="Why Suitable for My Research">
              <textarea value={form.why_suitable} onChange={f('why_suitable')} rows={2} placeholder="Why is this venue a good fit for your work?" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Page Limit">
                <input value={form.page_limit} onChange={f('page_limit')} placeholder="e.g. 8 pages + references" />
              </FormField>
              <FormField label="Submission Format / Template">
                <input value={form.submission_format} onChange={f('submission_format')} placeholder="e.g. IEEE double-column LaTeX" />
              </FormField>
            </div>

            <SectionDivider title="Important Dates (Conferences)" color="#f59e0b" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Submission Deadline">
                <input type="date" value={form.submission_deadline} onChange={f('submission_deadline')} />
              </FormField>
              <FormField label="Notification Date">
                <input type="date" value={form.notification_date} onChange={f('notification_date')} />
              </FormField>
              <FormField label="Camera Ready Date">
                <input type="date" value={form.camera_ready_date} onChange={f('camera_ready_date')} />
              </FormField>
              <FormField label="Event Date / Month">
                <input value={form.event_date} onChange={f('event_date')} placeholder="e.g. December 2025, Vancouver" />
              </FormField>
            </div>

            <SectionDivider title="Submission Tracking" color="var(--gold2)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Submission Status">
                <select value={form.status} onChange={f('status')}>
                  <option value="target">Target (Not Submitted)</option>
                  <option value="preparing">Preparing Submission</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </FormField>
              <FormField label="Date Submitted">
                <input type="date" value={form.submission_date} onChange={f('submission_date')} />
              </FormField>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Paper ID / Submission ID Received">
                  <input value={form.paper_id_received} onChange={f('paper_id_received')} placeholder="e.g. NeurIPS2025_12345" />
                </FormField>
              </div>
            </div>
            <FormField label="Review Notes / Reviewer Feedback">
              <textarea value={form.review_notes} onChange={f('review_notes')} rows={3} placeholder="Reviewer comments, meta-review, your responses..." />
            </FormField>
            <FormField label="Additional Notes">
              <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Any other notes about this venue..." />
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
          message={`Delete venue "${confirmDelete.name}"?`}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
