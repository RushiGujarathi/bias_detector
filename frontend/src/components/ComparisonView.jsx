import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts'
import ScoreRing from './ScoreRing'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}%
        </div>
      ))}
    </div>
  )
}

export default function ComparisonView({ before, after, fixInfo }) {
  // Build radar comparison
  const radarData = Object.keys(before.bias_metrics).map(key => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    Before: before.bias_metrics[key]?.bias_score || 0,
    After: after.bias_metrics[key]?.bias_score || 0,
  }))

  // Build bar comparison
  const barData = Object.keys(before.bias_metrics).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    Before: before.bias_metrics[key]?.bias_score || 0,
    After: after.bias_metrics[key]?.bias_score || 0,
  }))

  const improvement = after.overall_fairness_score - before.overall_fairness_score

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Score comparison */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, var(--surface) 100%)',
        border: '1px solid rgba(16,185,129,0.2)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">✅ Fairness Improved</div>
          <div className="section-subtitle">BEFORE vs AFTER COMPARISON</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={before.overall_fairness_score} size={140} label="Before Fix" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#10b981',
              fontFamily: 'var(--font-mono)',
            }}>
              +{improvement.toFixed(1)}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              IMPROVEMENT
            </div>
            <div style={{ marginTop: 12, fontSize: '1.5rem' }}>→</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={after.overall_fairness_score} size={140} label="After Fix" />
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginTop: 24,
        }}>
          {[
            { label: 'Records Before', val: before.total_rows, icon: '📊' },
            { label: 'Records After', val: after.total_rows, icon: '✨' },
            { label: 'Steps Applied', val: fixInfo?.steps_applied?.length || 0, icon: '🔧' },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{
              background: 'var(--surface2)',
              borderRadius: 10,
              padding: '14px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent)' }}>
                {val}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps applied */}
      {fixInfo?.steps_applied?.length > 0 && (
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: '1.1rem' }}>🔧 Fix Steps Applied</div>
          </div>
          {fixInfo.steps_applied.map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 0',
              borderBottom: i < fixInfo.steps_applied.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 24, height: 24,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.2)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', paddingTop: 3 }}>{step}</div>
            </div>
          ))}
        </div>
      )}

      {/* Radar comparison */}
      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ fontSize: '1.1rem' }}>📡 Bias Radar — Before vs After</div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
            <Radar name="Before" dataKey="Before" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
            <Radar name="After" dataKey="After" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar comparison */}
      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ fontSize: '1.1rem' }}>📊 Bias Score Comparison</div>
          <div className="section-subtitle">LOWER IS BETTER</div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }} />
            <Bar dataKey="Before" name="Before" fill="#ef4444" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            <Bar dataKey="After" name="After" fill="#10b981" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
