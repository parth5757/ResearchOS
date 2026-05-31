import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getPapers, createPaper, updatePaper, deletePaper } from '../api';
import { PageHeader, Card, CardTitle, Btn, FormRow, Modal, EmptyState, Tag, NoProject, Tabs } from '../components/Shared';
import { toast } from 'react-toastify';

const EMPTY_FORM = { title: '', authors: '', year: '', journal: '', doi: '', abstract: '', key_findings: '', gaps: '', methods: '', my_notes: '', relevance: 'medium', tags: '' };

const RELEVANCE_COLOR = { high: 'green', medium: 'gold', low: 'gray' };

export default function Literature() {
  const { activeProject, refreshDashboard } = useProject();
  const [papers, setPapers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editPaper, setEditPaper] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (activeProject) load(); }, [activeProject, tab]);

  const load = async () => {
    try {
      const params = {};
      if (tab !== 'all') params.relevance = tab;
      if (search) params.search = search;
      const res = await getPapers(activeProject.id, params);
      setPapers(res.data);
    } catch { toast.error('Failed to load papers'); }
  };

  const openNew = () => { setForm(EMPTY_FORM); setEditPaper(null); setModal(true); };
  const openEdit = (p) => { setForm(p); setEditPaper(p); setModal(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (editPaper) {
        const res = await updatePaper(activeProject.id, editPaper.id, form);
        setPapers(prev => prev.map(p => p.id === editPaper.id ? res.data : p));
        toast.success('Paper updated!');
      } else {
        const res = await createPaper(activeProject.id, { ...form, project: activeProject.id });
        setPapers(prev => [res.data, ...prev]);
        toast.success('Paper added!');
      }
      setModal(false);
      refreshDashboard();
    } catch { toast.error('Failed to save paper'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this paper?')) return;
    try {
      await deletePaper(activeProject.id, id);
      setPapers(prev => prev.filter(p => p.id !== id));
      refreshDashboard();
      toast.success('Paper deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!activeProject) return <NoProject />;

  const high = papers.filter(p => p.relevance === 'high').length;
  const withGaps = papers.filter(p => p.gaps?.trim().length > 5).length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader title="Phase 2 ·" accent="Literature Review"
        sub="Record every paper you read. Capture key findings, gaps, and your personal study notes."
        action={<Btn onClick={openNew}>+ Add Paper</Btn>} />

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Search by title, author, or tag…" style={{ maxWidth: 300 }} />
        <Btn variant="outline" size="sm" onClick={load}>Search</Btn>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          <span>{papers.length} total</span>
          <span style={{ color: 'var(--green)' }}>{high} high relevance</span>
          <span style={{ color: 'var(--teal)' }}>{withGaps} with gaps</span>
        </div>
      </div>

      <Tabs
        tabs={[{ key: 'all', label: 'All', count: papers.length }, { key: 'high', label: 'High Relevance' }, { key: 'medium', label: 'Medium' }, { key: 'low', label: 'Low' }]}
        active={tab} onChange={t => setTab(t)} />

      {papers.length === 0 ? (
        <EmptyState icon="📄" title="No papers yet" sub='Add your first paper with the "+ Add Paper" button above' />
      ) : (
        papers.map(p => (
          <div key={p.id} onClick={() => openEdit(p)}
            style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 8, cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg1)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--text0)', marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                  {[p.authors, p.year, p.journal].filter(Boolean).join(' · ')}
                </div>
                {p.key_findings && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 8 }}>
                    {p.key_findings.length > 150 ? p.key_findings.slice(0, 150) + '…' : p.key_findings}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag color={RELEVANCE_COLOR[p.relevance] || 'gray'}>{p.relevance}</Tag>
                  {p.gaps?.trim() && <Tag color="teal">gap identified</Tag>}
                  {p.my_notes?.trim() && <Tag color="purple">notes</Tag>}
                  {p.tags && p.tags.split(',').slice(0, 3).map((t, i) => <Tag key={i}>{t.trim()}</Tag>)}
                </div>
              </div>
              <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleDelete(p.id); }}>✕</Btn>
            </div>
          </div>
        ))
      )}

      {modal && (
        <Modal title={editPaper ? 'Edit Paper' : 'Add Paper'} onClose={() => setModal(false)} width={760}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="Title *" style={{ gridColumn: '1/-1' }}>
              <input value={form.title} onChange={f('title')} placeholder="Full paper title" autoFocus />
            </FormRow>
            <FormRow label="Authors">
              <input value={form.authors} onChange={f('authors')} placeholder="Smith, J. et al." />
            </FormRow>
            <FormRow label="Year">
              <input value={form.year} onChange={f('year')} placeholder="2024" />
            </FormRow>
            <FormRow label="Journal / Conference">
              <input value={form.journal} onChange={f('journal')} placeholder="NeurIPS, IEEE Trans., etc." />
            </FormRow>
            <FormRow label="DOI / URL">
              <input value={form.doi} onChange={f('doi')} placeholder="doi:10.xxxx or arxiv link" />
            </FormRow>
            <FormRow label="Abstract / Summary" style={{ gridColumn: '1/-1' }}>
              <textarea value={form.abstract} onChange={f('abstract')} placeholder="Paste abstract or write a brief summary…" style={{ minHeight: 80 }} />
            </FormRow>
            <FormRow label="Key Findings & Contributions" style={{ gridColumn: '1/-1' }}>
              <textarea value={form.key_findings} onChange={f('key_findings')} placeholder="What did this paper contribute? Main results, metrics, insights…" />
            </FormRow>
            <FormRow label="Research Gaps (mentioned or you found)" style={{ gridColumn: '1/-1' }}>
              <textarea value={form.gaps} onChange={f('gaps')} placeholder="Future work they suggest. What is still unsolved? What did they not address?" />
            </FormRow>
            <FormRow label="Methodology Used" style={{ gridColumn: '1/-1' }}>
              <textarea value={form.methods} onChange={f('methods')} placeholder="Dataset, model architecture, evaluation metrics, baseline comparisons…" style={{ minHeight: 60 }} />
            </FormRow>
            <FormRow label="My Personal Study Notes" style={{ gridColumn: '1/-1' }}>
              <textarea value={form.my_notes} onChange={f('my_notes')} placeholder="Your own analysis, what you want to try differently, how this connects to your thesis idea, questions it raised…" style={{ minHeight: 90 }} />
            </FormRow>
            <FormRow label="Relevance to My Thesis">
              <select value={form.relevance} onChange={f('relevance')}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </FormRow>
            <FormRow label="Tags (comma separated)">
              <input value={form.tags} onChange={f('tags')} placeholder="deep learning, credit risk, LSTM, XAI" />
            </FormRow>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editPaper ? '✓ Update Paper' : '✓ Add Paper'}</Btn>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
