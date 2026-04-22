import React from 'react'

export default function ScoreRing({ score, size = 160, label = 'Fairness Score' }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 75 ? '#10b981'
    : score >= 50 ? '#f59e0b'
    : '#ef4444'

  const grade = score >= 80 ? 'A'
    : score >= 65 ? 'B'
    : score >= 50 ? 'C'
    : score >= 35 ? 'D'
    : 'F'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={8}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease',
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
          <div style={{
            fontSize: size * 0.22,
            fontWeight: 800,
            color,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
          }}>
            {Math.round(score)}
          </div>
          <div style={{
            fontSize: size * 0.1,
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
          }}>/ 100</div>
          <div style={{
            fontSize: size * 0.14,
            fontWeight: 700,
            color,
            background: `${color}20`,
            padding: '2px 6px',
            borderRadius: 4,
          }}>{grade}</div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{label}</div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
          marginTop: 2,
        }}>
          {score >= 75 ? '✅ FAIR' : score >= 50 ? '⚠️ MODERATE BIAS' : '🚨 HIGH BIAS'}
        </div>
      </div>
    </div>
  )
}
