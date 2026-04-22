import React, { useState, useRef } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import BiasDashboard from './components/BiasDashboard'
import SuggestionsPanel from './components/SuggestionsPanel'
import ExplanationPanel from './components/ExplanationPanel'
import { analyzeDataset, getSuggestions, getSampleDataset } from './utils/api'

export default function App() {
  const [file, setFile] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [suggestData, setSuggestData] = useState(null)
  const [activeTab, setActiveTab] = useState('upload')
  const [loading, setLoading] = useState({ analyze: false, suggest: false, sample: false })
  const [error, setError] = useState(null)
  const resultsRef = useRef(null)

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }))

  const handleFile = (f) => {
    setFile(f)
    setAnalysisData(null)
    setSuggestData(null)
    setError(null)
    setActiveTab('upload')
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoad('analyze', true)
    setError(null)
    try {
      const data = await analyzeDataset(file)
      setAnalysisData(data)
      setActiveTab('analyze')
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed. Is the backend running?')
    } finally {
      setLoad('analyze', false)
    }
  }

  const handleSuggest = async () => {
    if (!file) return
    setLoad('suggest', true)
    setError(null)
    try {
      const data = await getSuggestions(file)
      setSuggestData(data)
      setActiveTab('suggest')
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not get suggestions. Is the backend running?')
    } finally {
      setLoad('suggest', false)
    }
  }

  const handleSample = async () => {
    setLoad('sample', true)
    setError(null)
    try {
      const data = await getSampleDataset()
      const blob = new Blob([data.csv], { type: 'text/csv' })
      const f = new File([blob], 'sample_biased_dataset.csv', { type: 'text/csv' })
      setFile(f)
      setAnalysisData(null)
      setSuggestData(null)
      setActiveTab('upload')
    } catch (e) {
      setError('Could not load sample dataset. Is the backend running?')
    } finally {
      setLoad('sample', false)
    }
  }

  const anyLoading = Object.values(loading).some(Boolean)

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />

      {/* Hero */}
      <section style={{
        padding: '80px 40px 60px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div className="badge badge-accent" style={{ marginBottom: 20, display: 'inline-flex' }}>
          ⚡ AI-POWERED FAIRNESS DETECTION
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          marginBottom: 20,
          animation: 'fadeUp 0.6s ease forwards',
        }}>
          Detect & Suggest
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Dataset Bias
          </span>
          Automatically
        </h1>

        <p style={{
          maxWidth: 580,
          margin: '0 auto 36px',
          color: 'var(--text-muted)',
          fontSize: '1.05rem',
          lineHeight: 1.7,
          animation: 'fadeUp 0.6s 0.1s ease both',
        }}>
          Upload your CSV dataset, detect gender, age and income bias in seconds, get AI-powered explanations, and auto-fix unfairness with one click.
        </p>

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          animation: 'fadeUp 0.6s 0.2s ease both',
        }}>
          {[
            { icon: '🔍', text: 'Bias Detection' },
            { icon: '✨', text: 'Gemini AI Insights' },
            { icon: '⚡', text: 'Auto Rebalancing' },
            { icon: '📊', text: 'Fairness Charts' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}>
              {icon} {text}
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* Left: Upload + Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Upload */}
            <div className="card" style={{ animation: 'fadeUp 0.5s 0.3s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="section-title" style={{ fontSize: '1.1rem' }}>Upload Dataset</div>
                  <div className="section-subtitle">CSV FORMAT · MAX 50MB</div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={handleSample}
                  disabled={anyLoading}
                  style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                >
                  {loading.sample ? <><span className="spinner" /> Loading...</> : '📥 Load Sample'}
                </button>
              </div>

              <UploadZone onFile={handleFile} loading={anyLoading} hasFile={!!file} />

              {file && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(0,229,255,0.05)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{ fontSize: '1.2rem' }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div className="badge badge-success">READY</div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                fontSize: '0.875rem',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <span>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Results tabs */}
            {(analysisData || suggestData) && (
              <div ref={resultsRef} style={{ animation: 'fadeUp 0.4s ease both' }}>
                {/* Tab nav */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 16,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 4,
                }}>
                  {[
                    { key: 'analyze', label: '🔍 Analysis', show: !!analysisData },
                    { key: 'explain', label: '✨ AI Insights', show: !!analysisData },
                    { key: 'suggest', label: '💡 Suggestions', show: !!suggestData },
                  ].filter(t => t.show).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                        background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                        color: activeTab === tab.key ? '#000' : 'var(--text-muted)',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === 'analyze' && analysisData && (
                  <BiasDashboard data={analysisData} />
                )}
                {activeTab === 'explain' && analysisData && (
                  <ExplanationPanel explanation={analysisData.explanation} />
                )}
                {activeTab === 'suggest' && suggestData && Array.isArray(suggestData.suggestions) && (
                  <>
                    <SuggestionsPanel data={suggestData} />
                    <div style={{ marginTop: 20 }}>
                      <ExplanationPanel explanation={suggestData.explanation} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Action panel */}
          <div style={{
            position: 'sticky',
            top: 90,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: 'fadeUp 0.5s 0.4s ease both',
          }}>
            {/* Action card */}
            <div className="card">
              <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ fontSize: '1rem' }}>Actions</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={!file || anyLoading}
                  style={{ justifyContent: 'center' }}
                >
                  {loading.analyze
                    ? <><span className="spinner" /> Analyzing...</>
                    : <><span>🔍</span> Detect Bias</>}
                </button>

                <button
                  className="btn btn-danger"
                  onClick={handleSuggest}
                  disabled={!file || anyLoading}
                  style={{ justifyContent: 'center' }}
                >
                  {loading.suggest
                    ? <><span className="spinner" /> Getting Suggestions...</>
                    : <><span>💡</span> Get Suggestions</>}
                </button>
              </div>
            </div>

            {/* Current scores */}
            {analysisData && (
              <div className="card">
                <div style={{ marginBottom: 12, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  CURRENT ANALYSIS
                </div>
                {[
                  { label: 'Rows', val: analysisData.total_rows, icon: '📊' },
                  { label: 'Columns', val: analysisData.columns?.length, icon: '📋' },
                  { label: 'Fairness', val: `${analysisData.overall_fairness_score}%`, icon: '⚖️' },
                  { label: 'Sensitive', val: analysisData.sensitive_columns?.length, icon: '🔍' },
                ].map(({ label, val, icon }) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{icon} {label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)' }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions count badge */}
            {suggestData?.suggestions?.length > 0 && (
              <div className="card" style={{ border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.04)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {suggestData.suggestions.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>Suggestions Ready</div>
                  <button
                    onClick={() => setActiveTab('suggest')}
                    className="btn btn-primary"
                    style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                  >
                    View All
                  </button>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="card">
              <div style={{ marginBottom: 12, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                HOW IT WORKS
              </div>
              {[
                { step: '01', text: 'Upload your CSV dataset', icon: '📤' },
                { step: '02', text: 'AI detects gender, age & income bias', icon: '🔍' },
                { step: '03', text: 'Gemini explains the issues', icon: '✨' },
                { step: '04', text: 'Get actionable fix suggestions', icon: '💡' },
                { step: '05', text: 'Apply fixes in your pipeline', icon: '⚙️' },
              ].map(({ step, text, icon }) => (
                <div key={step} style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 0',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    paddingTop: 2,
                    minWidth: 20,
                  }}>{step}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {icon} {text}
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics explained */}
            <div className="card">
              <div style={{ marginBottom: 12, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                FAIRNESS METRICS
              </div>
              {[
                { name: 'Disparate Impact', desc: 'Ratio ≥ 0.8 is considered fair' },
                { name: 'Distribution Bias', desc: 'Group representation imbalance' },
                { name: 'Positive Rate Gap', desc: 'Outcome disparity across groups' },
              ].map(({ name, desc }) => (
                <div key={name} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 40px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
      }}>
        UnbiasedAI · Bias Detection & Fairness Fixer · Powered by Gemini AI + FastAPI
      </footer>
    </div>
  )
}