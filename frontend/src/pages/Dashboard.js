import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { Card, CardTitle, ProgressRing, NoProject } from '../components/Shared';

const PHASES = [
  { key: 'domain', label: 'Domain Selection', icon: '◎', to: '/domain', desc: 'Define your research area' },
  { key: 'literature', label: 'Literature Review', icon: '📄', to: '/literature', desc: 'Record & annotate papers' },
  { key: 'problems', label: 'Problem Definition', icon: '⚠', to: '/problems', desc: 'Classify research problems' },
  { key: 'hypothesis', label: 'Hypothesis Workshop', icon: '⚡', to: '/hypothesis', desc: 'Generate, rank, evolve ideas' },
  { key: 'feasibility', label: 'Feasibility Analysis', icon: '📊', to: '/feasibility', desc: 'Assess data, compute, time' },
  { key: 'proposal', label: 'Thesis Proposal', icon: '📋', to: '/proposal', desc: 'Build proposal document' },
  { key: 'log', label: 'Research Log', icon: '📅', to: '/log', desc: 'Daily progress tracking' },
  { key: 'thesis', label: 'Thesis Writer', icon: '📖', to: '/thesis', desc: 'Write your complete thesis' },
];

export default function Dashboard() {
  const { activeProject, dashboard, refreshDashboard } = useProject();
  const navigate = useNavigate();

  useEffect(() => { refreshDashboard(); }, []);

  if (!activeProject) return <NoProject />;

  const pct = (key) => {
    if (!dashboard) return 0;
    const map = {
      domain: dashboard.has_domain ? 100 : 0,
      literature: Math.min(100, (dashboard.papers || 0) * 10),
      problems: Math.min(100, (dashboard.problems || 0) * 20),
      hypothesis: Math.min(100, (dashboard.hypotheses || 0) * 15),
      feasibility: dashboard.has_feasibility ? 60 : 0,
      proposal: dashboard.proposal_pct || 0,
      log: Math.min(100, (dashboard.logs || 0) * 8),
      thesis: Math.min(100, Math.round((dashboard.thesis_words || 0) / 200)),
    };
    return map[key] || 0;
  };

  const overall = Math.round(PHASES.reduce((s, p) => s + pct(p.key), 0) / PHASES.length);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700 }}>
          Research <span style={{ color: 'var(--gold2)' }}>Command Centre</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          {activeProject.name} — track every phase of your MTech thesis research
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { n: dashboard?.papers || 0, l: 'Papers Reviewed' },
          { n: dashboard?.problems || 0, l: 'Problems Defined' },
          { n: dashboard?.hypotheses || 0, l: 'Hypotheses' },
          { n: dashboard?.logs || 0, l: 'Log Entries' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 30, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--gold2)' }}>{s.n}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <Card accent="gold" style={{ marginBottom: 20 }}>
        <CardTitle>Overall Thesis Progress</CardTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ProgressRing pct={overall} size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--teal))', borderRadius: 4, width: `${overall}%`, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              <span>Phase 1: Domain Selection</span>
              <span>Phase 8: Thesis Complete</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Phase Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {PHASES.map((phase, i) => {
          const p = pct(phase.key);
          return (
            <div key={phase.key} onClick={() => navigate(phase.to)}
              style={{
                background: 'var(--bg1)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 16, cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg1)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{phase.icon}</span>
                <ProgressRing pct={p} size={48}
                  color={p === 100 ? 'var(--green)' : p > 0 ? 'var(--gold2)' : 'var(--text3)'} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)', marginBottom: 2 }}>Phase {i + 1}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>{phase.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{phase.desc}</div>
              <div style={{ marginTop: 8, fontSize: 11, color: p === 100 ? 'var(--green)' : p > 0 ? 'var(--gold)' : 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {p === 0 ? '○ Not started' : p === 100 ? '✓ Complete' : '● In progress'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active domain */}
      {dashboard?.has_domain && activeProject && (
        <Card accent="teal" style={{ marginTop: 20 }}>
          <CardTitle>Active Research Project</CardTitle>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text0)' }}>{activeProject.name}</div>
          {activeProject.description && (
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>{activeProject.description}</div>
          )}
        </Card>
      )}
    </div>
  );
}
