import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getProposal, saveProposal } from '../api';
import { PageHeader, Card, CardTitle, Btn, NoProject, ProgressRing, Divider } from '../components/Shared';
import { toast } from 'react-toastify';

const SECTIONS = [
  { key: 'title_abstract', num: '01', label: 'Title & Abstract', placeholder: 'Write a concise, compelling title and a 200–250 word abstract. The abstract should cover: background, gap, your approach, and expected contribution.' },
  { key: 'introduction', num: '02', label: 'Introduction & Background', placeholder: 'Introduce the problem domain. Explain why it matters. Present the specific gap your research addresses. End with your research objectives.' },
  { key: 'lit_review_summary', num: '03', label: 'Literature Review Summary', placeholder: 'Summarize the key prior work in your area. Group papers by theme/approach. Show how your work differs from or extends each group.' },
  { key: 'problem_statement', num: '04', label: 'Problem Statement', placeholder: 'State the exact research problem you are solving. Be precise. Include: What is unknown? Why does it matter? What will your thesis answer?' },
  { key: 'hypothesis_section', num: '05', label: 'Research Hypothesis / Questions', placeholder: 'State your primary hypothesis clearly. List 2–3 research questions your thesis will answer. Define success criteria.' },
  { key: 'methodology', num: '06', label: 'Proposed Methodology', placeholder: 'Describe your approach in detail: Dataset(s), preprocessing, model/method, evaluation metrics, baselines, experimental setup.' },
  { key: 'timeline', num: '07', label: 'Timeline & Milestones', placeholder: 'Provide a month-by-month plan from start to submission. Include milestones, deliverables, and buffer time.' },
  { key: 'resources', num: '08', label: 'Resources Required', placeholder: 'List data sources, software tools, compute resources, collaborations, and any other requirements.' },
  { key: 'expected_contribution', num: '09', label: 'Expected Contribution', placeholder: 'What will this thesis add to knowledge? What problem does it solve? Who will benefit? How is this novel?' },
  { key: 'references', num: '10', label: 'Key References', placeholder: 'List 10–20 key papers in your area. Format: [1] Author, Title, Journal/Conference, Year, DOI.' },
];

export default function Proposal() {
  const { activeProject, refreshDashboard } = useProject();
  const [data, setData] = useState({});
  const [expanded, setExpanded] = useState('title_abstract');
  const [saving, setSaving] = useState({});
  const [autoSaveTimer, setAutoSaveTimer] = useState({});

  useEffect(() => { if (activeProject) load(); }, [activeProject]);

  const load = async () => {
    try {
      const res = await getProposal(activeProject.id);
      if (res.status === 200 && res.data.id) setData(res.data);
    } catch {}
  };

  const handleChange = (key, val) => {
    setData(prev => ({ ...prev, [key]: val }));
    // Auto-save debounce
    if (autoSaveTimer[key]) clearTimeout(autoSaveTimer[key]);
    const timer = setTimeout(() => handleSave(key, val), 2000);
    setAutoSaveTimer(prev => ({ ...prev, [key]: timer }));
  };

  const handleSave = async (key, val) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const payload = { project: activeProject.id, [key]: val !== undefined ? val : data[key] };
      const res = await saveProposal(activeProject.id, payload);
      setData(prev => ({ ...prev, ...res.data }));
      refreshDashboard();
    } catch { toast.error(`Failed to save section`); }
    setSaving(prev => ({ ...prev, [key]: false }));
  };

  if (!activeProject) return <NoProject />;

  const wordCount = (key) => (data[key] || '').split(/\s+/).filter(Boolean).length;
  const filled = SECTIONS.filter(s => (data[s.key] || '').length > 30).length;
  const completionPct = Math.round((filled / SECTIONS.length) * 100);
  const totalWords = SECTIONS.reduce((sum, s) => sum + wordCount(s.key), 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <PageHeader title="Phase 5 ·" accent="Thesis Proposal"
        sub="Build your complete proposal document section by section. Changes auto-save after 2 seconds."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{filled}/{SECTIONS.length} sections</div>
              <div style={{ fontSize: 12, color: 'var(--gold2)', fontFamily: 'var(--font-mono)' }}>{totalWords.toLocaleString()} words</div>
            </div>
            <ProgressRing pct={completionPct} size={56} />
          </div>
        } />

      {/* Overall progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--teal))', borderRadius: 3, width: `${completionPct}%`, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          <span>Section 01</span><span>{completionPct}% complete</span><span>Section 10</span>
        </div>
      </div>

      {SECTIONS.map(sec => {
        const isOpen = expanded === sec.key;
        const wc = wordCount(sec.key);
        const isDone = (data[sec.key] || '').length > 30;
        return (
          <div key={sec.key} style={{ background: 'var(--bg1)', border: `1px solid ${isOpen ? 'var(--border2)' : 'var(--border)'}`, borderRadius: 10, marginBottom: 4, overflow: 'hidden' }}>
            <div onClick={() => setExpanded(isOpen ? null : sec.key)}
              style={{ padding: '13px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isOpen ? 'var(--bg2)' : 'transparent', transition: 'background 0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>{sec.num}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: isOpen ? 'var(--text0)' : 'var(--text1)' }}>{sec.label}</span>
                {isDone && <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>✓</span>}
                {saving[sec.key] && <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>saving…</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {wc > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{wc} words</span>}
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>{isOpen ? '▴' : '▾'}</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: '0 18px 18px' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, lineHeight: 1.5 }}>{sec.placeholder.split('\n')[0]}</div>
                <textarea
                  value={data[sec.key] || ''}
                  onChange={e => handleChange(sec.key, e.target.value)}
                  placeholder={sec.placeholder}
                  style={{ minHeight: 200, width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', color: 'var(--text0)', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{wc} words · auto-saves after 2s</span>
                  <Btn size="sm" onClick={() => handleSave(sec.key)} disabled={saving[sec.key]}>
                    {saving[sec.key] ? 'Saving…' : '✓ Save Now'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
