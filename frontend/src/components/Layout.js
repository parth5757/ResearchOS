import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { createProject, deleteProject } from '../api';
import { toast } from 'react-toastify';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⊞', section: null },
  { section: 'Research Phases' },
  { to: '/domain', label: 'Domain Selection', icon: '◎' },
  { to: '/literature', label: 'Literature Review', icon: '📄' },
  { to: '/paper-readings', label: 'Paper Readings', icon: '🔬' },
  { to: '/survey-readings', label: 'Survey Readings', icon: '🗺' },
  { to: '/problems', label: 'Problem Definition', icon: '⚠' },
  { to: '/hypothesis', label: 'Hypothesis Workshop', icon: '⚡' },
  { to: '/feasibility', label: 'Feasibility Analysis', icon: '📊' },
  { to: '/proposal', label: 'Thesis Proposal', icon: '📋' },
  { section: 'Execution & Writing' },
  { to: '/log', label: 'Research Log', icon: '📅' },
  { to: '/thesis', label: 'Thesis Writer', icon: '📖' },
  { section: 'Publication' },
  { to: '/venues', label: 'Journals & Conferences', icon: '🏛' },
];

export default function Layout({ children }) {
  const { projects, setProjects, activeProject, setActiveProject, dashboard, loading } = useProject();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await createProject({ name: newName, description: newDesc });
      setProjects(prev => [res.data, ...prev]);
      setActiveProject(res.data);
      setNewName(''); setNewDesc(''); setShowNewProject(false);
      toast.success('Project created!');
      navigate('/domain');
    } catch { toast.error('Failed to create project'); }
  };

  const pct = (key) => {
    if (!dashboard) return 0;
    const map = {
      '/domain': dashboard.has_domain ? 100 : 0,
      '/literature': Math.min(100, (dashboard.papers || 0) * 10),
      '/problems': Math.min(100, (dashboard.problems || 0) * 20),
      '/hypothesis': Math.min(100, (dashboard.hypotheses || 0) * 15),
      '/feasibility': dashboard.has_feasibility ? 60 : 0,
      '/proposal': dashboard.proposal_pct || 0,
      '/log': Math.min(100, (dashboard.logs || 0) * 8),
      '/thesis': Math.min(100, Math.round((dashboard.thesis_words || 0) / 200)),
    };
    return map[key] || 0;
  };

  const overall = NAV.filter(n => n.to && n.to !== '/').reduce((s, n) => s + pct(n.to), 0) / 11;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 248, minWidth: 248, background: 'var(--bg1)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--gold2)', fontWeight: 700 }}>
            ResearchOS
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginTop: 2 }}>
            MTech Thesis Tracker
          </div>
        </div>

        {/* Project Selector */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Active Project</div>
          {projects.length > 0 ? (
            <select
              value={activeProject?.id || ''}
              onChange={e => {
                const p = projects.find(p => p.id === parseInt(e.target.value));
                if (p) setActiveProject(p);
              }}
              style={{ fontSize: 12, padding: '6px 8px', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--gold3)', fontWeight: 600 }}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>No projects yet</div>
          )}
          <button
            onClick={() => setShowNewProject(true)}
            style={{ marginTop: 8, width: '100%', padding: '5px', background: 'transparent', border: '1px dashed var(--border2)', borderRadius: 6, color: 'var(--text3)', fontSize: 12, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold2)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--text3)'; }}
          >
            + New Project
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV.map((item, i) => {
            if (item.section) return (
              <div key={i} style={{ padding: '8px 16px 3px', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {item.section}
              </div>
            );
            const p = pct(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 16px', fontSize: 13,
                  color: isActive ? 'var(--gold2)' : 'var(--text2)',
                  background: isActive ? 'var(--bg3)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                  transition: 'all 0.12s', textDecoration: 'none',
                })}
                onMouseEnter={e => { if (!e.currentTarget.className) { e.currentTarget.style.background = 'var(--bg2)'; } }}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.to !== '/' && p > 0 && (
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: p === 100 ? 'var(--green)' : 'var(--text3)', background: 'var(--bg4)', padding: '1px 5px', borderRadius: 8 }}>
                    {p === 100 ? '✓' : `${Math.round(p)}%`}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Progress */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 5 }}>
            <span>Overall Progress</span>
            <span style={{ color: 'var(--gold2)' }}>{Math.round(overall)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--teal))', borderRadius: 2, width: `${overall}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg0)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            Loading…
          </div>
        ) : !activeProject && !showNewProject ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text0)' }}>Welcome to ResearchOS</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Create your first research project to get started</div>
            <button onClick={() => setShowNewProject(true)} style={{ padding: '10px 24px', background: 'var(--gold)', color: '#0a0c10', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
              Create Project
            </button>
          </div>
        ) : children}
      </main>

      {/* New Project Modal */}
      {showNewProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowNewProject(false)}>
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 14, padding: 28, width: 440, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text0)', marginBottom: 20 }}>New Research Project</div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Project Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. ML for Credit Risk MTech Thesis" autoFocus required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description of your research direction..." style={{ minHeight: 70 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '9px 20px', background: 'var(--gold)', color: '#0a0c10', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Create</button>
                <button type="button" onClick={() => setShowNewProject(false)} style={{ padding: '9px 20px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
