import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getHypotheses, createHypothesis, updateHypothesis, deleteHypothesis, selectHypothesis, updateElo, getProblems } from '../api';
import { PageHeader, Card, CardTitle, Btn, FormRow, Modal, EmptyState, Tag, NoProject, Tabs, Divider, ScoreSlider } from '../components/Shared';
import { toast } from 'react-toastify';

const EMPTY = {
  statement: '', rationale: '', testing_method: '', expected_outcome: '',
  strengths: '', weaknesses: '', assumptions: '',
  novelty_score: 5, feasibility_score: 5, impact_score: 5, testability_score: 5,
  evolved_version: '', evolution_notes: '', problem: '',
};

export default function Hypothesis() {
  const { activeProject, refreshDashboard } = useProject();
  const [hypotheses, setHypotheses] = useState([]);
  const [problems, setProblems] = useState([]);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [eloModal, setEloModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState('all');
  const [saving, setSaving] = useState(false);
  const [eloWinner, setEloWinner] = useState('');

  const eloColor = (elo) => elo >= 1300 ? 'var(--gold2)' : elo >= 1200 ? 'var(--teal)' : 'var(--text3)';
  const [eloLoser, setEloLoser] = useState('');

  useEffect(() => { if (activeProject) { load(); loadProblems(); } }, [activeProject]);

  const load = async () => {
    try {
      const res = await getHypotheses(activeProject.id);
      setHypotheses(res.data);
    } catch { toast.error('Failed to load hypotheses'); }
  };

  const loadProblems = async () => {
    try {
      const res = await getProblems(activeProject.id);
      setProblems(res.data);
    } catch {}
  };

  const openNew = () => { setForm(EMPTY); setEditItem(null); setModal(true); };
  const openEdit = (h) => { setForm({ ...h, problem: h.problem || '' }); setEditItem(h); setModal(true); };

  const handleSave = async () => {
    if (!form.statement.trim()) { toast.error('Hypothesis statement required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, project: activeProject.id };
      if (!payload.problem) payload.problem = null;
      if (editItem) {
        const res = await updateHypothesis(activeProject.id, editItem.id, payload);
        setHypotheses(prev => prev.map(h => h.id === editItem.id ? res.data : h));
        toast.success('Updated!');
      } else {
        const res = await createHypothesis(activeProject.id, payload);
        setHypotheses(prev => [res.data, ...prev]);
        toast.success('Hypothesis added!');
      }
      setModal(false);
      refreshDashboard();
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hypothesis?')) return;
    try {
      await deleteHypothesis(activeProject.id, id);
      setHypotheses(prev => prev.filter(h => h.id !== id));
      refreshDashboard();
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleSelect = async (id) => {
    try {
      const res = await selectHypothesis(activeProject.id, id);
      setHypotheses(prev => prev.map(h => ({ ...h, is_selected: h.id === id })));
      toast.success('Hypothesis selected as primary!');
    } catch { toast.error('Failed'); }
  };

  const handleElo = async () => {
    if (!eloWinner || !eloLoser || eloWinner === eloLoser) { toast.error('Select two different hypotheses'); return; }
    try {
      const res = await updateElo(activeProject.id, { winner_id: eloWinner, loser_id: eloLoser });
      setHypotheses(prev => prev.map(h => {
        if (h.id === res.data.winner.id) return res.data.winner;
        if (h.id === res.data.loser.id) return res.data.loser;
        return h;
      }));
      setEloModal(false);
      setEloWinner(''); setEloLoser('');
      toast.success(`Elo updated! Winner gained points.`);
    } catch { toast.error('Elo update failed'); }
  };

  const f = k => e => setForm({ ...form, [k]: typeof e === 'object' ? e.target.value : e });

  if (!activeProject) return <NoProject />;

  const sorted = [...hypotheses].sort((a, b) => b.elo_rating - a.elo_rating);
  const selected = hypotheses.find(h => h.is_selected);


  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader title="Phase 4 ·" accent="Hypothesis Workshop"
        sub="Generate, critique, rank, and evolve your research hypotheses. Select the strongest one for your thesis."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="outline" onClick={() => setEloModal(true)} disabled={hypotheses.length < 2}>⚡ Elo Matchup</Btn>
            <Btn onClick={openNew}>+ Add Hypothesis</Btn>
          </div>
        } />

      {selected && (
        <Card accent="gold" style={{ marginBottom: 20 }}>
          <CardTitle>★ Selected Primary Hypothesis</CardTitle>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text0)', lineHeight: 1.6 }}>{selected.statement}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--gold2)', background: 'rgba(201,147,58,0.15)', padding: '2px 8px', borderRadius: 4 }}>
              Elo {selected.elo_rating}
            </span>
            {selected.problem_title && <Tag color="teal">{selected.problem_title}</Tag>}
          </div>
        </Card>
      )}

      {hypotheses.length === 0 ? (
        <EmptyState icon="⚡" title="No hypotheses yet"
          sub="After defining your problems, start adding hypotheses — possible solutions or answers to your research question." />
      ) : (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            {hypotheses.length} hypotheses · sorted by Elo rating (highest first)
          </div>
          {sorted.map((h, i) => (
            <div key={h.id}
              style={{
                background: h.is_selected ? 'rgba(201,147,58,0.04)' : 'var(--bg1)',
                border: `1px solid ${h.is_selected ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 10, padding: 16, marginBottom: 10,
              }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Rank badge */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0,
                  background: i === 0 ? 'rgba(201,147,58,0.2)' : i === 1 ? 'rgba(45,212,191,0.15)' : 'var(--bg3)',
                  color: i === 0 ? 'var(--gold2)' : i === 1 ? 'var(--teal)' : 'var(--text3)',
                  border: `1px solid ${i === 0 ? 'var(--gold)' : i === 1 ? 'var(--teal)' : 'var(--border)'}`,
                }}>
                  #{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--text0)', lineHeight: 1.6, marginBottom: 8 }}>{h.statement}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: eloColor(h.elo_rating), background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>
                      Elo {h.elo_rating}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>avg {h.avg_score}/10</span>
                    {h.problem_title && <Tag color="teal">{h.problem_title}</Tag>}
                    {h.is_selected && <Tag color="gold">★ Selected</Tag>}
                    {h.evolved_version?.trim() && <Tag color="purple">evolved</Tag>}
                    {h.weaknesses?.trim() && <Tag color="gray">critique logged</Tag>}
                  </div>
                  {h.evolved_version?.trim() && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, borderLeft: '2px solid var(--purple)', fontSize: 12, color: 'var(--text1)' }}>
                      <span style={{ color: 'var(--purple)', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Evolved: </span>
                      {h.evolved_version.slice(0, 150)}{h.evolved_version.length > 150 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Btn variant="ghost" size="sm" onClick={() => setDetailModal(h)}>↗</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => openEdit(h)}>✎</Btn>
                  {!h.is_selected && <Btn variant="green" size="sm" onClick={() => handleSelect(h.id)}>★ Select</Btn>}
                  <Btn variant="ghost" size="sm" onClick={() => handleDelete(h.id)}>✕</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={editItem ? 'Edit Hypothesis' : 'Add Hypothesis'} onClose={() => setModal(false)} width={760}>
          <FormRow label="Hypothesis Statement *">
            <textarea value={form.statement} onChange={f('statement')}
              placeholder="State your hypothesis clearly. e.g. 'An LSTM-based model trained on alternative financial data will outperform traditional logistic regression for credit default prediction by at least 10% AUC.'"
              style={{ minHeight: 90 }} autoFocus />
          </FormRow>
          <FormRow label="Linked Research Problem">
            <select value={form.problem} onChange={f('problem')}>
              <option value="">— No linked problem —</option>
              {problems.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="Rationale — Why This Hypothesis?">
              <textarea value={form.rationale} onChange={f('rationale')} placeholder="Scientific reasoning behind this hypothesis…" style={{ minHeight: 80 }} />
            </FormRow>
            <FormRow label="Testing Method">
              <textarea value={form.testing_method} onChange={f('testing_method')} placeholder="How will you test/validate this hypothesis?" style={{ minHeight: 80 }} />
            </FormRow>
            <FormRow label="Expected Outcome">
              <textarea value={form.expected_outcome} onChange={f('expected_outcome')} placeholder="What result would confirm / reject this hypothesis?" style={{ minHeight: 70 }} />
            </FormRow>
            <FormRow label="Potential Impact">
              <textarea value={form.strengths} onChange={f('strengths')} placeholder="What are the strengths and positive aspects?" style={{ minHeight: 70 }} />
            </FormRow>
          </div>

          <Divider />
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            🔍 Reflection — Critical Self-Analysis
          </div>
          <FormRow label="Weaknesses & Flaws">
            <textarea value={form.weaknesses} onChange={f('weaknesses')} placeholder="What could be wrong? What assumptions might fail? Where is this fragile?" style={{ minHeight: 80 }} />
          </FormRow>
          <FormRow label="Key Assumptions">
            <textarea value={form.assumptions} onChange={f('assumptions')} placeholder="What must be true for this hypothesis to hold? List all assumptions." style={{ minHeight: 70 }} />
          </FormRow>

          <Divider />
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            📈 Ranking Scores (1–10)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[['novelty_score','Novelty'],['feasibility_score','Feasibility'],['impact_score','Impact'],['testability_score','Testability']].map(([k, l]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>{l}: {form[k]}/10</label>
                <input type="range" min={1} max={10} value={form[k]} onChange={e => setForm({ ...form, [k]: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--gold)', height: 4, cursor: 'pointer' }} />
              </div>
            ))}
          </div>

          <Divider />
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            🔄 Evolution — Improved Version
          </div>
          <FormRow label="Evolved / Refined Hypothesis Statement">
            <textarea value={form.evolved_version} onChange={f('evolved_version')}
              placeholder="After critique and reflection, write a refined, stronger version of this hypothesis…" style={{ minHeight: 80 }} />
          </FormRow>
          <FormRow label="Evolution Notes">
            <textarea value={form.evolution_notes} onChange={f('evolution_notes')} placeholder="What changed and why? What critique led to this improvement?" style={{ minHeight: 60 }} />
          </FormRow>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editItem ? '✓ Update' : '✓ Add Hypothesis'}</Btn>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <Modal title="Hypothesis Detail" onClose={() => setDetailModal(null)} width={680}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text0)', lineHeight: 1.6, marginBottom: 16, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 8, borderLeft: '3px solid var(--gold)' }}>
            {detailModal.statement}
          </div>
          {detailModal.problem_title && <div style={{ marginBottom: 12 }}><Tag color="teal">{detailModal.problem_title}</Tag></div>}
          {[
            ['Rationale', detailModal.rationale],
            ['Testing Method', detailModal.testing_method],
            ['Expected Outcome', detailModal.expected_outcome],
            ['Strengths', detailModal.strengths],
            ['Weaknesses', detailModal.weaknesses],
            ['Key Assumptions', detailModal.assumptions],
            ['Evolved Version', detailModal.evolved_version],
            ['Evolution Notes', detailModal.evolution_notes],
          ].filter(([, v]) => v?.trim()).map(([label, val]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[['Novelty', detailModal.novelty_score], ['Feasibility', detailModal.feasibility_score], ['Impact', detailModal.impact_score], ['Testability', detailModal.testability_score]].map(([l, v]) => (
              <div key={l} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', color: 'var(--gold2)', fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            Elo Rating: <span style={{ color: eloColor(detailModal.elo_rating), fontWeight: 700 }}>{detailModal.elo_rating}</span>
          </div>
        </Modal>
      )}

      {/* Elo Matchup Modal */}
      {eloModal && (
        <Modal title="⚡ Elo Matchup — Which Hypothesis Wins?" onClose={() => setEloModal(false)} width={500}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
            Compare two hypotheses head-to-head. Select the winner — the Elo rating will update automatically (K=32).
          </p>
          <FormRow label="Winner (stronger hypothesis)">
            <select value={eloWinner} onChange={e => setEloWinner(e.target.value)}>
              <option value="">— Select winner —</option>
              {hypotheses.map(h => <option key={h.id} value={h.id}>[{h.elo_rating}] {h.statement.slice(0, 60)}…</option>)}
            </select>
          </FormRow>
          <FormRow label="Loser (weaker hypothesis)">
            <select value={eloLoser} onChange={e => setEloLoser(e.target.value)}>
              <option value="">— Select loser —</option>
              {hypotheses.map(h => <option key={h.id} value={h.id}>[{h.elo_rating}] {h.statement.slice(0, 60)}…</option>)}
            </select>
          </FormRow>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleElo}>Update Elo Ratings</Btn>
            <Btn variant="outline" onClick={() => setEloModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );

}
