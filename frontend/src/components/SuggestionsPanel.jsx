import React, { useState } from 'react'

const SEVERITY_CONFIG = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: '🚨' },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', icon: '⚠️' },
  Medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '📋' },
  Info:     { color: '#00e5ff', bg: 'rgba(0,229,255,0.05)', border: 'rgba(0,229,255,0.15)', icon: 'ℹ️' },
}

const CATEGORY_ICONS = { Gender: '👥', Age: '📅', Income: '💰', General: '⚙️' }

function SuggestionCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.Info
  return (
    <div style={{ border: `1px solid ${cfg.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={() => setExpanded(e => !e)} style={{ width: '100%', padding: '14px 16px', background: cfg.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: cfg.color, letterSpacing: '0.08em' }}>
              {CATEGORY_ICONS[item.category] || ''} {(item.category || '').toUpperCase()}
            </span>
            <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
              {item.severity}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
            {item.issue}
          </div>
        </div>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▼</span>
      </button>
      {expanded && (
        <div style={{ padding: '16px 18px', background: 'var(--surface2)', borderTop: `1px solid ${cfg.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>ISSUE DETECTED</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.issue}</div>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>💡 RECOMMENDATION</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.7, padding: '10px 14px', background: 'rgba(0,229,255,0.04)', borderLeft: '3px solid var(--accent)', borderRadius: '0 8px 8px 0' }}>
              {item.suggestion}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>🔧 TECHNIQUE</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>{item.technique}</div>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>📈 EXPECTED IMPACT</div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, lineHeight: 1.4 }}>{item.impact}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SuggestionsPanel({ data }) {
  const [filterSeverity, setFilterSeverity] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')

  if (!data || typeof data !== 'object') return null

  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : []

  const counts = { Critical: 0, High: 0, Medium: 0, Info: 0 }
  suggestions.forEach(s => { if (s && counts[s.severity] !== undefined) counts[s.severity]++ })

  const categories = ['All', ...new Set(suggestions.map(s => s && s.category).filter(Boolean))]
  const severities = ['All', 'Critical', 'High', 'Medium', 'Info']

  const filtered = suggestions.filter(s =>
    s &&
    (filterSeverity === 'All' || s.severity === filterSeverity) &&
    (filterCategory === 'All' || s.category === filterCategory)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--surface), rgba(0,229,255,0.03))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="section-title">💡 Fairness Suggestions</div>
            <div className="section-subtitle">READ-ONLY · ORIGINAL DATA UNCHANGED</div>
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: '0.8rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ✅ Your CSV file was <strong>not modified</strong> — these are recommendations only
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([sev, count]) => {
              if (!count) return null
              const cfg = SEVERITY_CONFIG[sev]
              return (
                <div key={sev} style={{ padding: '6px 12px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: '0.75rem', fontWeight: 700, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
                  {cfg.icon} {count} {sev}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>SEVERITY:</span>
          {severities.map(s => (
            <button key={s} onClick={() => setFilterSeverity(s)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: filterSeverity === s ? 'var(--accent)' : 'transparent', color: filterSeverity === s ? '#000' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ height: 20, width: 1, background: 'var(--border)' }} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>CATEGORY:</span>
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCategory(c)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: filterCategory === c ? 'var(--accent2)' : 'transparent', color: filterCategory === c ? '#fff' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} of {suggestions.length} shown
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
            No suggestions for selected filters.
          </div>
        ) : (
          filtered.map((item, i) => <SuggestionCard key={i} item={item} />)
        )}
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', gap: 10 }}>
        <span>📌</span>
        <span>These suggestions are based on statistical analysis. Apply them in your <strong style={{ color: 'var(--text-muted)' }}>data pipeline or model training</strong> — not by editing raw CSV values.</span>
      </div>
    </div>
  )
}