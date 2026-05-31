import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getFeasibility, saveFeasibility } from '../api';
import { PageHeader, Card, CardTitle, Btn, FormRow, NoProject, ScoreSlider, ProgressRing, Divider } from '../components/Shared';
import { toast } from 'react-toastify';

const DEFAULT = {
  data_availability: 50, compute_available: 50, time_feasibility: 50, expertise_match: 50,
  data_sources: '', compute_plan: '', timeline_plan: '', risk_notes: '', notes: '', is_done: false,
};

export default function Feasibility() {
  const { activeProject, refreshDashboard } = useProject();
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState(null);

  useEffect(() => { if (activeProject) load(); }, [activeProject]);

  const load = async () => {
    try {
      const res = await getFeasibility(activeProject.id);
      if (res.status === 200 && res.data.id) {
        setForm(res.data);
        setExistingId(res.data.id);
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFeasibility(activeProject.id, { ...form, project: activeProject.id });
      refreshDashboard();
      toast.success('Feasibility assessment saved!');
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const overall = Math.round((form.data_availability + form.compute_available + form.time_feasibility + form.expertise_match) / 4);
  const overallColor = overall >= 65 ? 'var(--green)' : overall >= 40 ? 'var(--gold)' : 'var(--red)';
  const verdict = overall >= 70 ? 'FEASIBLE' : overall >= 45 ? 'BORDERLINE' : 'AT RISK';
  const verdictColor = overall >= 70 ? 'var(--green)' : overall >= 45 ? 'var(--gold)' : 'var(--red)';

  if (!activeProject) return <NoProject />;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <PageHeader title="Phase 4b ·" accent="Feasibility Analysis"
        sub="Honestly assess data availability, compute resources, timeline, and risks before committing." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <Card accent="gold">
            <CardTitle>Feasibility Scores</CardTitle>
            <ScoreSlider label="Data Availability" value={form.data_availability} onChange={v => setForm({ ...form, data_availability: v })} />
            <ScoreSlider label="Compute Available" value={form.compute_available} onChange={v => setForm({ ...form, compute_available: v })} />
            <ScoreSlider label="Time Feasibility" value={form.time_feasibility} onChange={v => setForm({ ...form, time_feasibility: v })} />
            <ScoreSlider label="Expertise Match" value={form.expertise_match} onChange={v => setForm({ ...form, expertise_match: v })} />
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Overall Verdict</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: verdictColor, marginTop: 2 }}>{verdict}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Score: {overall}/100</div>
              </div>
              <ProgressRing pct={overall} size={72} color={overallColor} />
            </div>
          </Card>

          <Card>
            <CardTitle>Data & Resources</CardTitle>
            <FormRow label="Available Data Sources">
              <textarea value={form.data_sources} onChange={e => setForm({ ...form, data_sources: e.target.value })}
                placeholder="e.g. Yahoo Finance (free), Kaggle credit datasets, SEC EDGAR filings, FRED macroeconomic data..."
                style={{ minHeight: 80 }} />
            </FormRow>
            <FormRow label="Compute Plan">
              <textarea value={form.compute_plan} onChange={e => setForm({ ...form, compute_plan: e.target.value })}
                placeholder="e.g. NVIDIA RTX 5050 (local), Google Colab Pro, AU HPC cluster, AWS Free Tier..."
                style={{ minHeight: 70 }} />
            </FormRow>
            <FormRow label="Mark as Complete">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text1)' }}>
                <input type="checkbox" checked={form.is_done} onChange={e => setForm({ ...form, is_done: e.target.checked })}
                  style={{ width: 'auto', accentColor: 'var(--green)' }} />
                Feasibility analysis completed
              </label>
            </FormRow>
          </Card>
        </div>

        <div>
          <Card>
            <CardTitle>Timeline Plan</CardTitle>
            <textarea value={form.timeline_plan} onChange={e => setForm({ ...form, timeline_plan: e.target.value })}
              placeholder={`Month 1–2: Literature review & domain exploration\nMonth 3–4: Dataset acquisition & preprocessing\nMonth 5–6: Baseline model implementation\nMonth 7–9: Main experiments & ablation studies\nMonth 10–11: Writing & refinement\nMonth 12: Submission & viva preparation`}
              style={{ minHeight: 200, width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8 }} />
          </Card>

          <Card accent="red">
            <CardTitle>⚠ Risks & Mitigation</CardTitle>
            <textarea value={form.risk_notes} onChange={e => setForm({ ...form, risk_notes: e.target.value })}
              placeholder={`Risk: Dataset not publicly available → Mitigation: Use Kaggle alternatives\nRisk: Insufficient compute → Mitigation: Apply for Colab Pro or AU HPC\nRisk: Scope too large → Mitigation: Narrow to one sub-problem\nRisk: No baseline to compare → Mitigation: Reproduce a published baseline first`}
              style={{ minHeight: 140, width: '100%' }} />
          </Card>

          <Card>
            <CardTitle>Additional Notes</CardTitle>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Supervisor feedback on feasibility, additional concerns, dependency notes..." style={{ minHeight: 100, width: '100%' }} />
          </Card>

          <Btn onClick={handleSave} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Saving…' : '✓ Save Feasibility Assessment'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
