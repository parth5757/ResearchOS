import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getDomain, saveDomain } from '../api';
import { PageHeader, Card, CardTitle, Btn, FormRow, NoProject, Divider } from '../components/Shared';
import { toast } from 'react-toastify';

export default function Domain() {
  const { activeProject, refreshDashboard } = useProject();
  const [form, setForm] = useState({ topic: '', subarea: '', supervisor: '', keywords: '', motivation: '', notes: '' });
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeProject) loadDomain();
  }, [activeProject]);

  const loadDomain = async () => {
    try {
      const res = await getDomain(activeProject.id);
      if (res.status === 200 && res.data.id) {
        setForm(res.data);
        setSaved(res.data);
      }
    } catch {}
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveDomain(activeProject.id, { ...form, project: activeProject.id });
      setSaved(form);
      refreshDashboard();
      toast.success('Domain saved!');
    } catch (e) {
      toast.error('Failed to save domain');
    }
    setLoading(false);
  };

  if (!activeProject) return <NoProject />;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <PageHeader title="Phase 1 ·" accent="Domain Selection" sub="Define your research area, motivation, and initial scope before diving into literature." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left - Core info */}
        <Card accent="gold">
          <CardTitle>Research Identity</CardTitle>
          <FormRow label="Research Topic / Working Title *">
            <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g. Machine Learning for Financial Risk Prediction" />
          </FormRow>
          <FormRow label="Sub-domain / Specialization">
            <input value={form.subarea} onChange={e => setForm({ ...form, subarea: e.target.value })}
              placeholder="e.g. Credit Risk, Fraud Detection, Portfolio Optimization" />
          </FormRow>
          <FormRow label="Supervisor (if confirmed)">
            <input value={form.supervisor} onChange={e => setForm({ ...form, supervisor: e.target.value })}
              placeholder="Prof. Name, Department" />
          </FormRow>
          <FormRow label="Search Keywords (comma separated)">
            <input value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })}
              placeholder="e.g. LSTM, credit scoring, explainability, XGBoost, deep learning" />
          </FormRow>
          <Divider />
          <FormRow label="Motivation — Why This Topic?">
            <textarea value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })}
              placeholder="What draws you to this area? What gap do you see? Why does it matter?"
              style={{ minHeight: 110 }} />
          </FormRow>
          <Btn onClick={handleSave} disabled={!form.topic || loading}>
            {loading ? 'Saving…' : '✓ Save Domain'}
          </Btn>
        </Card>

        {/* Right - Notes & confirmation */}
        <div>
          <Card>
            <CardTitle>Free-form Research Notes</CardTitle>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything interesting you've noticed, papers you've glimpsed, initial thoughts, advisor feedback, reading list ideas..."
              style={{ minHeight: 200, width: '100%' }} />
          </Card>

          {saved?.topic && (
            <Card accent="green" style={{ marginTop: 0 }}>
              <CardTitle>✓ Saved Domain</CardTitle>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text0)', marginBottom: 8 }}>{saved.topic}</div>
              {saved.subarea && (
                <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, background: 'rgba(45,212,191,0.1)', color: 'var(--teal)', border: '1px solid rgba(45,212,191,0.25)', marginBottom: 8 }}>
                  {saved.subarea}
                </div>
              )}
              {saved.supervisor && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Supervisor: {saved.supervisor}</div>}
              {saved.keywords && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Keywords: {saved.keywords}</div>}
              {saved.motivation && (
                <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 6, fontSize: 13, color: 'var(--text1)', lineHeight: 1.6 }}>
                  {saved.motivation}
                </div>
              )}
            </Card>
          )}

          {/* Quick reference */}
          <Card style={{ marginTop: 0, background: 'var(--bg2)' }}>
            <CardTitle>Phase 1 Checklist</CardTitle>
            {[
              'Defined a clear research topic',
              'Identified sub-domain / specialization',
              'Confirmed or identified a supervisor',
              'Listed key search terms for papers',
              'Written your motivation clearly',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 13, color: 'var(--text1)' }}>
                <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{i + 1}.</span>
                {item}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
