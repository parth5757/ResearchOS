import React from 'react';

export function PageHeader({ title, accent, sub, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--text0)', fontWeight: 700 }}>
          {title} {accent && <span style={{ color: 'var(--gold2)' }}>{accent}</span>}
        </h1>
        {(sub || subtitle) && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{sub || subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, accent, style, onClick }) {
  const borderColor = { gold: 'var(--gold)', teal: 'var(--teal)', green: 'var(--green)', red: 'var(--red)', purple: 'var(--purple)' };
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderLeft: accent ? `3px solid ${borderColor[accent] || 'var(--gold)'}` : undefined,
      borderRadius: 12, padding: 20, marginBottom: 16,
      cursor: onClick ? 'pointer' : 'default',
      transition: onClick ? 'border-color 0.15s' : undefined,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text2)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>{children}</div>;
}

export function Btn({ children, variant = 'gold', size = 'md', onClick, disabled, type = 'button', style }) {
  const variants = {
    gold: { background: 'var(--gold)', color: '#0a0c10', border: 'none' },
    outline: { background: 'transparent', color: 'var(--text1)', border: '1px solid var(--border2)' },
    ghost: { background: 'transparent', color: 'var(--text2)', border: 'none' },
    teal: { background: 'var(--teal)', color: '#0a0c10', border: 'none' },
    red: { background: 'var(--red2)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' },
    green: { background: 'var(--green2)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.3)' },
  };
  const sizes = {
    sm: { padding: '5px 10px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      borderRadius: 8, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
      ...variants[variant], ...sizes[size], ...style,
    }}>
      {children}
    </button>
  );
}

export function Tag({ children, color = 'gray' }) {
  const colors = {
    gray: { bg: 'var(--bg3)', text: 'var(--text2)', border: 'var(--border)' },
    gold: { bg: 'rgba(201,147,58,0.15)', text: 'var(--gold2)', border: 'rgba(201,147,58,0.3)' },
    teal: { bg: 'rgba(45,212,191,0.1)', text: 'var(--teal)', border: 'rgba(45,212,191,0.25)' },
    red: { bg: 'rgba(248,113,113,0.1)', text: 'var(--red)', border: 'rgba(248,113,113,0.25)' },
    green: { bg: 'rgba(74,222,128,0.1)', text: 'var(--green)', border: 'rgba(74,222,128,0.25)' },
    purple: { bg: 'rgba(167,139,250,0.1)', text: 'var(--purple)', border: 'rgba(167,139,250,0.25)' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--font-mono)', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  );
}

export function FormRow({ label, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{label}</label>}
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 580 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 14, padding: 26, width, maxWidth: '95vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text0)', fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', padding: '2px 6px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, sub, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>{title || message}</div>
      {sub && <div style={{ fontSize: 13, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function Badge({ children, color, textColor, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 20, fontSize: 11, fontFamily: 'var(--font-mono)',
      background: color || 'var(--bg3)',
      color: textColor || '#fff',
      fontWeight: 600,
      ...style,
    }}>
      {children}
    </span>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontSize: 15, color: 'var(--text0)', marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onConfirm} style={{ padding: '8px 18px', background: 'var(--red2)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Delete
          </button>
          <button onClick={onCancel} style={{ padding: '8px 18px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProgressRing({ pct, size = 64, color = 'var(--gold2)', label }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * circ;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg3)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: size < 56 ? 11 : 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{pct}%</div>
        {label && <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>}
      </div>
    </div>
  );
}

export function Divider({ style }) {
  return <div style={{ height: 1, background: 'var(--border)', margin: '16px 0', ...style }} />;
}

export function ScoreSlider({ label, value, onChange, color }) {
  const pct = value;
  const col = color || (pct >= 65 ? 'var(--green)' : pct >= 35 ? 'var(--gold)' : 'var(--red)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)', width: 145, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: col, width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text2)', width: 32, textAlign: 'right' }}>{pct}%</span>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: 72, height: 4, accentColor: col, background: 'transparent', border: 'none', cursor: 'pointer' }} />
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: '8px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'none',
          border: 'none', borderBottom: `2px solid ${active === t.key ? 'var(--gold)' : 'transparent'}`,
          color: active === t.key ? 'var(--gold2)' : 'var(--text3)', cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: 0.8, transition: 'all 0.15s', marginBottom: -1,
        }}>
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span style={{ marginLeft: 5, fontSize: 10, background: 'var(--bg3)', padding: '1px 5px', borderRadius: 8, color: 'var(--text3)' }}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function NoProject() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text3)', gap: 10 }}>
      <div style={{ fontSize: 36 }}>◎</div>
      <div style={{ fontSize: 15, color: 'var(--text2)' }}>No project selected</div>
      <div style={{ fontSize: 13 }}>Create or select a project from the sidebar</div>
    </div>
  );
}
