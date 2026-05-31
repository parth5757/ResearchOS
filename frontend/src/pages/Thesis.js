import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { getThesisChapters, saveThesisChapter } from '../api';
import { PageHeader, Btn, NoProject, ProgressRing } from '../components/Shared';
import { toast } from 'react-toastify';

const CHAPTERS = [
  { key: 'abstract', label: 'Abstract', desc: '250-word summary of the entire thesis', target: 300 },
  { key: 'ch1', label: 'Chapter 1 — Introduction', desc: 'Background, motivation, objectives, thesis structure', target: 3000 },
  { key: 'ch2', label: 'Chapter 2 — Literature Review', desc: 'Comprehensive review and critique of related work', target: 5000 },
  { key: 'ch3', label: 'Chapter 3 — Methodology', desc: 'Research design, datasets, models, evaluation framework', target: 4000 },
  { key: 'ch4', label: 'Chapter 4 — Implementation', desc: 'System design, experimental setup, technical details', target: 3500 },
  { key: 'ch5', label: 'Chapter 5 — Results & Discussion', desc: 'Findings, analysis, comparison with baselines', target: 4000 },
  { key: 'ch6', label: 'Chapter 6 — Conclusion', desc: 'Contributions, limitations, future work directions', target: 2000 },
  { key: 'refs', label: 'References', desc: 'Full bibliography in the required citation format', target: 1000 },
  { key: 'appendix', label: 'Appendix', desc: 'Code snippets, extra tables, supplementary figures', target: 1000 },
];

export default function Thesis() {
  const { activeProject, refreshDashboard } = useProject();
  const [chapters, setChapters] = useState({});
  const [activeKey, setActiveKey] = useState('abstract');
  const [saving, setSaving] = useState({});
  const [autoTimer, setAutoTimer] = useState({});
  const [wordCountDisplay, setWordCountDisplay] = useState({});
  const textareaRef = useRef(null);

  useEffect(() => { if (activeProject) load(); }, [activeProject]);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [activeKey]);

  const load = async () => {
    try {
      const res = await getThesisChapters(activeProject.id);
      const map = {};
      res.data.forEach(c => { map[c.chapter_key] = c; });
      setChapters(map);
      const wc = {};
      res.data.forEach(c => { wc[c.chapter_key] = c.word_count || 0; });
      setWordCountDisplay(wc);
    } catch { toast.error('Failed to load thesis chapters'); }
  };

  const handleChange = (key, val) => {
    setChapters(prev => ({ ...prev, [key]: { ...(prev[key] || {}), content: val } }));
    const wc = val.split(/\s+/).filter(Boolean).length;
    setWordCountDisplay(prev => ({ ...prev, [key]: wc }));

    if (autoTimer[key]) clearTimeout(autoTimer[key]);
    const timer = setTimeout(() => handleSave(key, val), 1500);
    setAutoTimer(prev => ({ ...prev, [key]: timer }));
  };

  const handleSave = async (key, val) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const content = val !== undefined ? val : (chapters[key]?.content || '');
      const res = await saveThesisChapter(activeProject.id, { chapter_key: key, content, project: activeProject.id });
      setChapters(prev => ({ ...prev, [key]: res.data }));
      setWordCountDisplay(prev => ({ ...prev, [key]: res.data.word_count || 0 }));
      refreshDashboard();
    } catch { toast.error('Save failed'); }
    setSaving(prev => ({ ...prev, [key]: false }));
  };

  if (!activeProject) return <NoProject />;

  const totalWords = Object.values(wordCountDisplay).reduce((s, v) => s + (v || 0), 0);
  const totalTarget = CHAPTERS.reduce((s, c) => s + c.target, 0);
  const overallPct = Math.min(100, Math.round((totalWords / totalTarget) * 100));

  const activeChapter = CHAPTERS.find(c => c.key === activeKey);
  const activeContent = chapters[activeKey]?.content || '';
  const activeWC = wordCountDisplay[activeKey] || 0;
  const activeTarget = activeChapter?.target || 1000;
  const activeProgress = Math.min(100, Math.round((activeWC / activeTarget) * 100));

  return (
    <div style={{ padding: '28px 32px 0', maxWidth: '100%', height: 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700 }}>
            Phase 7 · <span style={{ color: 'var(--gold2)' }}>Thesis Writer</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            Write your complete thesis chapter by chapter. Auto-saves every 1.5 seconds.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--gold2)', fontWeight: 700 }}>{totalWords.toLocaleString()} words</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>target ~{(totalTarget / 1000).toFixed(0)}k words</div>
          </div>
          <ProgressRing pct={overallPct} size={60} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, flex: 1, overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 28 }}>
        {/* Chapter list sidebar */}
        <div style={{ width: 230, minWidth: 230, background: 'var(--bg1)', borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Chapters
          </div>
          {CHAPTERS.map(ch => {
            const wc = wordCountDisplay[ch.key] || 0;
            const pct = Math.min(100, Math.round((wc / ch.target) * 100));
            const isActive = activeKey === ch.key;
            return (
              <div key={ch.key} onClick={() => setActiveKey(ch.key)}
                style={{
                  padding: '11px 14px', cursor: 'pointer',
                  background: isActive ? 'var(--bg3)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                  transition: 'all 0.12s',
                }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--gold2)' : 'var(--text2)', marginBottom: 3 }}>
                  {ch.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--text3)', width: `${pct}%`, transition: 'width 0.3s', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {wc > 0 ? `${wc}w` : '—'}
                  </span>
                </div>
                {saving[ch.key] && <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>saving…</div>}
              </div>
            );
          })}

          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>TOTAL PROGRESS</div>
            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--teal))', width: `${overallPct}%`, transition: 'width 0.4s', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold2)', fontFamily: 'var(--font-mono)', marginTop: 4, fontWeight: 700 }}>{overallPct}%</div>
          </div>
        </div>

        {/* Editor area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Editor header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text0)' }}>{activeChapter?.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{activeChapter?.desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: activeProgress >= 80 ? 'var(--green)' : 'var(--gold2)' }}>
                  {activeWC.toLocaleString()} / ~{activeTarget.toLocaleString()} words
                </div>
                <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
                  <div style={{ height: '100%', background: activeProgress >= 80 ? 'var(--green)' : 'var(--gold)', width: `${activeProgress}%`, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
              <Btn size="sm" onClick={() => handleSave(activeKey)} disabled={saving[activeKey]}>
                {saving[activeKey] ? 'Saving…' : '✓ Save'}
              </Btn>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={activeContent}
            onChange={e => handleChange(activeKey, e.target.value)}
            placeholder={`Start writing ${activeChapter?.label}...\n\n${activeChapter?.desc}\nTarget: ~${activeTarget.toLocaleString()} words`}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: 'var(--bg0)', color: 'var(--text0)',
              fontFamily: '"Inter", sans-serif', fontSize: 15, lineHeight: 1.9,
              padding: '28px 36px', width: '100%',
            }}
          />

          {/* Status bar */}
          <div style={{ padding: '6px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg1)', display: 'flex', gap: 20, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
            <span>{activeWC} words</span>
            <span>{activeContent.length} characters</span>
            <span>{activeContent.split('\n').length} lines</span>
            <span style={{ marginLeft: 'auto' }}>
              {saving[activeKey] ? '● saving…' : '○ saved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
