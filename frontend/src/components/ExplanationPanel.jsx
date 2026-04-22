import React from 'react'
import ReactMarkdown from 'react-markdown'

export default function ExplanationPanel({ explanation, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 60, height: 60 }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px solid rgba(0,229,255,0.1)',
              borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px solid transparent',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 10,
              border: '2px solid transparent',
              borderTopColor: 'var(--accent2)',
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite reverse',
            }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Gemini AI Analyzing...</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              Generating fairness insights
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!explanation) return null

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, var(--surface) 0%, rgba(124,58,237,0.04) 100%)',
      border: '1px solid rgba(124,58,237,0.2)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent2), #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
        }}>✨</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Gemini AI Analysis</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            BIAS EXPLANATION & RECOMMENDATIONS
          </div>
        </div>
        <div className="badge badge-accent" style={{ marginLeft: 'auto' }}>
          AI GENERATED
        </div>
      </div>

      <div className="prose" style={{
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 10,
        padding: '16px 20px',
      }}>
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  )
}
