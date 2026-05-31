import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getProblems, createProblem, updateProblem, deleteProblem } from '../api';
import { PageHeader, Card, CardTitle, Btn, FormRow, Modal, EmptyState, Tag, NoProject, Tabs, Divider } from '../components/Shared';
import { toast } from 'react-toastify';

const EMPTY = { title: '', description: '', source_papers: '', status: 'unsolved', difficulty: 'medium', existing_work: '', my_approach: '', potential_impact: '' };

const STATUS_COLOR = { unsolved: 'red', partially_solved: 'gold', open: 'purple', solved: 'green' };
const STATUS_LABEL = { unsolved: 'Unsolved', partially_solved: 'Partially Solved', open: 'Open / Debated', solved: 'Solved' };

export default function Problems() {
  const { activeProject, refreshDashboard } = useProject();
  const [problems, setProblems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (activeProject) load(); }, [activeProject, tab]);

  const load = async () => {
    try {
      const params = tab !== 'all' ? { status: tab } : {};
      const res = await getProblems(activeProject.id, params);
      setProblems(res.data);
    } catch { toast.error('Failed to load problems'); }
  };

  const openNew = () => { setForm(EMPTY); setEditItem(null); setModal(true); };
  const openEdit = (p) => { setForm(p); setEditItem(p); setModal(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      if (editItem) {
        const res = await updateProblem(activeProject.id, editItem.id, form);
        setProblems(prev => prev.map(p => p.id === editItem.id ? res.data : p));
        toast.success('Problem updated!');
      } else {
        const res = await createProblem(activeProject.id, { ...form, project: activeProject.id });
        setProblems(prev => [res.data, ...prev]);
        toast.success('Problem added!');
      }
      setModal(false);
      refreshDashboard();
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    try {
      await deleteProblem(activeProject.id, id);
      setProblems(prev => prev.filter(p => p.id !== id));
      refreshDashboard();
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  if (!activeProject) return <NoProject />;

  const counts = { all: problems.length, unsolved: 0, partially_solved: 0, open: 0, solved: 0 };
  problems.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <PageHeader title="Phase 3 ·" accent="Problem Definition"
        sub="Identify, classify, and record every research problem found in your literature review."
        action={<Btn onClick={openNew}>+ Add Problem</Btn>} />

      <Tabs
        tabs={[
          { key: 'all', label: 'All Problems', count: counts.all },
          { key: 'unsolved', label: 'Unsolved', count: counts.unsolved },
          { key: 'partially_solved', label: 'Partial', count: counts.partially_solved },
          { key: 'open', label: 'Open', count: counts.open },
          { key: 'solved', label: 'Solved', count: counts.solved },
        ]}
        active={tab} onChange={t => { setTab(t); }} />

      {problems.length === 0 ? (
        <EmptyState icon="⚠" title="No problems defined yet"
          sub="Add problems manually, or first complete your literature review to extract gaps." />
      ) : (
        problems.map(p => (
          <div key={p.id}
            style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text0)', marginBottom: 5, fontFamily: 'var(--font-serif)' }}>{p.title}</div>
                {p.source_papers && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                    Source: {p.source_papers}
                  </div>
                )}
                {p.description && (
                  <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.6, marginBottom: 10 }}>{p.description}</div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: p.my_approach ? 10 : 0 }}>
                  <Tag color={STATUS_COLOR[p.status] || 'gray'}>{STATUS_LABEL[p.status] || p.status}</Tag>
                  <Tag color="gray">{p.difficulty}</Tag>
                  {p.my_approach?.trim() && <Tag color="teal">approach defined</Tag>}
                  {p.hypotheses_count > 0 && <Tag color="purple">{p.hypotheses_count} hypotheses</Tag>}
                </div>
                {p.my_approach?.trim() && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, borderLeft: '2px solid var(--teal)', fontSize: 12, color: 'var(--text1)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>My Approach: </span>
                    {p.my_approach}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                <Btn variant="ghost" size="sm" onClick={() => openEdit(p)}>✎</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>✕</Btn>
              </div>
            </div>
          </div>
        ))
      )}

      {modal && (
        <Modal title={editItem ? 'Edit Problem' : 'Define Research Problem'} onClose={() => setModal(false)} width={680}>
          <FormRow label="Problem Title *">
            <input value={form.title} onChange={f('title')} placeholder="Clear, specific problem statement" autoFocus />
          </FormRow>
          <FormRow label="Full Description">
            <textarea value={form.description} onChange={f('description')} placeholder="Describe the problem in detail. What exactly is unknown or unsolved?" style={{ minHeight: 90 }} />
          </FormRow>
          <FormRow label="Source Paper(s)">
            <input value={form.source_papers} onChange={f('source_papers')} placeholder="Title(s) of papers where this problem was identified" />
          </FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="Status">
              <select value={form.status} onChange={f('status')}>
                <option value="unsolved">Unsolved</option>
                <option value="partially_solved">Partially Solved</option>
                <option value="open">Open / Debated</option>
                <option value="solved">Already Solved</option>
              </select>
            </FormRow>
            <FormRow label="Difficulty">
              <select value={form.difficulty} onChange={f('difficulty')}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="very_hard">Very Hard</option>
              </select>
            </FormRow>
          </div>
          <FormRow label="Existing Work & Prior Approaches">
            <textarea value={form.existing_work} onChange={f('existing_work')} placeholder="What has already been tried? Why is it insufficient?" style={{ minHeight: 80 }} />
          </FormRow>
          <FormRow label="My Proposed Approach">
            <textarea value={form.my_approach} onChange={f('my_approach')} placeholder="How would you approach solving this? What method, dataset, angle?" style={{ minHeight: 80 }} />
          </FormRow>
          <FormRow label="Potential Impact & Importance">
            <textarea value={form.potential_impact} onChange={f('potential_impact')} placeholder="Why does solving this matter? Who benefits? What changes?" style={{ minHeight: 70 }} />
          </FormRow>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editItem ? '✓ Update' : '✓ Add Problem'}</Btn>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
