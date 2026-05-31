import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getLogs, createLog, updateLog, deleteLog } from '../api';
import { PageHeader, Card, CardTitle, Btn, FormRow, Modal, EmptyState, Tag, NoProject, Tabs } from '../components/Shared';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const EMPTY = { date: new Date().toISOString().split('T')[0], phase: 'execution', hours_worked: '', achieved: '', remaining: '', blockers: '', notes: '' };

const PHASE_COLOR = {
  literature: 'teal', problem_def: 'gold', hypothesis: 'purple',
  execution: 'green', writing: 'blue', revision: 'gray',
};
const PHASE_LABEL = {
  literature: 'Literature Review', problem_def: 'Problem Definition',
  hypothesis: 'Hypothesis Dev.', execution: 'Execution',
  writing: 'Writing', revision: 'Revision',
};

export default function Log() {
  const { activeProject, refreshDashboard } = useProject();
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (activeProject) load(); }, [activeProject, tab]);

  const load = async () => {
    try {
      const params = tab !== 'all' ? { phase: tab } : {};
      const res = await getLogs(activeProject.id, params);
      setLogs(res.data);
    } catch { toast.error('Failed to load logs'); }
  };

  const openNew = () => {
    setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] });
    setEditItem(null); setModal(true);
  };
  const openEdit = (l) => { setForm(l); setEditItem(l); setModal(true); };

  const handleSave = async () => {
    if (!form.date) { toast.error('Date required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, project: activeProject.id, hours_worked: form.hours_worked || null };
      if (editItem) {
        const res = await updateLog(activeProject.id, editItem.id, payload);
        setLogs(prev => prev.map(l => l.id === editItem.id ? res.data : l));
        toast.success('Log updated!');
      } else {
        const res = await createLog(activeProject.id, payload);
        setLogs(prev => [res.data, ...prev]);
        toast.success('Log entry added!');
      }
      setModal(false);
      refreshDashboard();
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log entry?')) return;
    try {
      await deleteLog(activeProject.id, id);
      setLogs(prev => prev.filter(l => l.id !== id));
      refreshDashboard();
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const f = k => e => setForm({ ...form, [k]: e.target.value });

  if (!activeProject) return <NoProject />;

  // Chart data — last 14 days hours
  const chartData = (() => {
    const map = {};
    logs.forEach(l => {
      if (l.hours_worked) {
        map[l.date] = (map[l.date] || 0) + parseFloat(l.hours_worked);
      }
    });
    return Object.entries(map).slice(-14).map(([date, hours]) => ({ date: date.slice(5), hours }));
  })();

  const totalHours = logs.reduce((s, l) => s + (parseFloat(l.hours_worked) || 0), 0);
  const hasBlockers = logs.filter(l => l.blockers?.trim()).length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <PageHeader title="Phase 6 ·" accent="Research Log"
        sub="Track daily progress — what you achieved, what remains, and any blockers."
        action={<Btn onClick={openNew}>+ New Entry</Btn>} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { n: logs.length, l: 'Total Entries' },
          { n: `${totalHours.toFixed(1)}h`, l: 'Hours Tracked' },
          { n: hasBlockers, l: 'Blocker Days' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 26, fontFamily: 'var(--font-mono)', color: 'var(--gold2)', fontWeight: 500 }}>{s.n}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Hours chart */}
      {chartData.length > 1 && (
        <Card style={{ marginBottom: 20 }}>
          <CardTitle>Hours Worked — Last 14 Days</CardTitle>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, color: 'var(--text0)' }} cursor={{ fill: 'rgba(201,147,58,0.08)' }} />
              <Bar dataKey="hours" fill="var(--gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Tabs
        tabs={[
          { key: 'all', label: 'All', count: logs.length },
          { key: 'execution', label: 'Execution' },
          { key: 'literature', label: 'Literature' },
          { key: 'writing', label: 'Writing' },
          { key: 'hypothesis', label: 'Hypothesis' },
        ]}
        active={tab} onChange={t => setTab(t)} />

      {logs.length === 0 ? (
        <EmptyState icon="📅" title="No log entries yet" sub="Start logging your daily research work to track progress over time." />
      ) : (
        logs.map(l => (
          <div key={l.id}
            style={{
              borderLeft: `3px solid ${l.blockers?.trim() ? 'var(--red)' : 'var(--teal)'}`,
              background: 'var(--bg1)', borderRadius: '0 10px 10px 0',
              padding: 16, marginBottom: 10,
              borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--gold2)', fontWeight: 700 }}>{l.date}</span>
                  <Tag color={PHASE_COLOR[l.phase] || 'gray'}>{PHASE_LABEL[l.phase] || l.phase}</Tag>
                  {l.hours_worked && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{l.hours_worked}h</span>}
                  {l.blockers?.trim() && <Tag color="red">⚠ blockers</Tag>}
                </div>

                {l.achieved?.trim() && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>✓ Achieved</div>
                    <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.6 }}>{l.achieved}</div>
                  </div>
                )}

                {l.remaining?.trim() && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>→ Remaining</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{l.remaining}</div>
                  </div>
                )}

                {l.blockers?.trim() && (
                  <div style={{ marginBottom: 8, padding: '8px 10px', background: 'var(--red2)', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>⚠ Blockers</div>
                    <div style={{ fontSize: 13, color: 'var(--red)', lineHeight: 1.6 }}>{l.blockers}</div>
                  </div>
                )}

                {l.notes?.trim() && (
                  <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{l.notes}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                <Btn variant="ghost" size="sm" onClick={() => openEdit(l)}>✎</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleDelete(l.id)}>✕</Btn>
              </div>
            </div>
          </div>
        ))
      )}

      {modal && (
        <Modal title={editItem ? 'Edit Log Entry' : 'New Research Log Entry'} onClose={() => setModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormRow label="Date *">
              <input type="date" value={form.date} onChange={f('date')} />
            </FormRow>
            <FormRow label="Phase">
              <select value={form.phase} onChange={f('phase')}>
                <option value="literature">Literature Review</option>
                <option value="problem_def">Problem Definition</option>
                <option value="hypothesis">Hypothesis Development</option>
                <option value="execution">Research Execution</option>
                <option value="writing">Thesis Writing</option>
                <option value="revision">Revision</option>
              </select>
            </FormRow>
            <FormRow label="Hours Worked">
              <input type="number" min="0" max="24" step="0.5" value={form.hours_worked} onChange={f('hours_worked')} placeholder="e.g. 4.5" />
            </FormRow>
          </div>
          <FormRow label="What I Achieved Today">
            <textarea value={form.achieved} onChange={f('achieved')}
              placeholder="Specific tasks completed, experiments run, papers read, code written, sections drafted..."
              style={{ minHeight: 90 }} autoFocus />
          </FormRow>
          <FormRow label="What Remains / Next Steps">
            <textarea value={form.remaining} onChange={f('remaining')}
              placeholder="What needs to be done next? Clear priorities for tomorrow or the coming days..." />
          </FormRow>
          <FormRow label="Blockers & Issues">
            <textarea value={form.blockers} onChange={f('blockers')}
              placeholder="Any problems, errors, confusions, missing data, compute issues, or conceptual blocks?"
              style={{ minHeight: 70 }} />
          </FormRow>
          <FormRow label="Notes & Insights">
            <textarea value={form.notes} onChange={f('notes')}
              placeholder="Ideas sparked today, things to remember, connections made, questions raised..."
              style={{ minHeight: 70 }} />
          </FormRow>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editItem ? '✓ Update Entry' : '✓ Save Entry'}</Btn>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
