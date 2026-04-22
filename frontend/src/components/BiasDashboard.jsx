import React from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  Legend, CartesianGrid
} from 'recharts'
import ScoreRing from './ScoreRing'

const COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }

function BiasBar({ label, score }) {
  const color = score < 20 ? '#10b981' : score < 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{label}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color,
          fontWeight: 700,
        }}>{score}%</span>
      </div>
      <div style={{
        height: 8,
        background: 'var(--border)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          borderRadius: 4,
          transition: 'width 1s ease',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--accent)', fontWeight: 700 }}>
          {p.name}: {p.value}%
        </div>
      ))}
    </div>
  )
}

export default function BiasDashboard({ data }) {
  const { bias_metrics, overall_fairness_score } = data

  // Radar chart data
  const radarData = Object.entries(bias_metrics).map(([key, val]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    biasScore: val.bias_score || 0,
    fairness: 100 - (val.bias_score || 0),
  }))

  // Distribution charts
  const buildDistChart = (key) => {
    const m = bias_metrics[key]
    if (!m?.distribution) return []
    return Object.entries(m.distribution).map(([group, pct]) => ({
      name: group,
      percentage: pct,
    }))
  }

  // Positive rate chart
  const buildRateChart = (key) => {
    const m = bias_metrics[key]
    if (!m?.positive_rates) return []
    return Object.entries(m.positive_rates).map(([group, rate]) => ({
      name: group,
      rate,
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Score overview */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(0,229,255,0.03) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div className="section-title">Fairness Analysis</div>
            <div className="section-subtitle">DATASET BIAS REPORT</div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="badge badge-accent">
                📊 {data.total_rows} Records
              </div>
              <div className="badge badge-accent">
                🔍 {Object.keys(bias_metrics).length} Factors Analyzed
              </div>
              {data.target_column && (
                <div className="badge badge-warning">
                  🎯 Target: {data.target_column}
                </div>
              )}
            </div>
          </div>
          <ScoreRing score={overall_fairness_score} />
        </div>
      </div>

      {/* Bias scores per category */}
      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ fontSize: '1.1rem' }}>Bias Scores by Category</div>
          <div className="section-subtitle">HIGHER = MORE BIASED</div>
        </div>
        {Object.entries(bias_metrics).map(([key, val]) => (
          <BiasBar key={key} label={`${key} bias`} score={val.bias_score || 0} />
        ))}
      </div>

      {/* Radar chart */}
      {radarData.length > 0 && (
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: '1.1rem' }}>Bias Radar</div>
            <div className="section-subtitle">MULTI-DIMENSIONAL FAIRNESS VIEW</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
              <Radar name="Bias Score" dataKey="biasScore" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
              <Radar name="Fairness" dataKey="fairness" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gender Distribution + Rates */}
      {bias_metrics.gender && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div style={{ marginBottom: 12 }}>
              <div className="section-title" style={{ fontSize: '1rem' }}>👥 Gender Distribution</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={buildDistChart('gender')}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" name="Share %" fill="var(--accent)" radius={[4, 4, 0, 0]}>
                  {buildDistChart('gender').map((_, i) => (
                    <Cell key={i} fill={i === 0 ? 'var(--accent)' : 'var(--accent2)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {bias_metrics.gender.positive_rates && (
            <div className="card">
              <div style={{ marginBottom: 12 }}>
                <div className="section-title" style={{ fontSize: '1rem' }}>📈 Hire Rate by Gender</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={buildRateChart('gender')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" name="Rate %" radius={[4, 4, 0, 0]}>
                    {buildRateChart('gender').map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {bias_metrics.gender.disparate_impact !== undefined && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: bias_metrics.gender.disparate_impact < 0.8 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  border: `1px solid ${bias_metrics.gender.disparate_impact < 0.8 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>Disparate Impact Ratio</span>
                  <span style={{
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: bias_metrics.gender.disparate_impact < 0.8 ? '#ef4444' : '#10b981',
                  }}>
                    {bias_metrics.gender.disparate_impact}
                    {bias_metrics.gender.disparate_impact < 0.8 ? ' ⚠️' : ' ✅'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Age Distribution */}
      {bias_metrics.age && (
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ fontSize: '1rem' }}>📅 Age Group Distribution</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Mean: {bias_metrics.age.mean_age}y
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Std: ±{bias_metrics.age.std_age}y
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={buildDistChart('age')}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" name="Share %" radius={[4, 4, 0, 0]}>
                {buildDistChart('age').map((_, i) => (
                  <Cell key={i} fill={['var(--accent)', 'var(--accent2)', '#f59e0b', '#ef4444'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
