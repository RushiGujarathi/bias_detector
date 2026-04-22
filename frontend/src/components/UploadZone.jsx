import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function UploadZone({ onFile, loading, hasFile }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: loading,
  })

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '56px 40px',
        textAlign: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s',
        background: isDragActive
          ? 'rgba(0, 229, 255, 0.04)'
          : 'rgba(13, 20, 33, 0.5)',
        boxShadow: isDragActive ? 'var(--glow-strong)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Scanline effect on hover */}
      {isDragActive && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          animation: 'scanline 1.5s linear infinite',
        }} />
      )}

      <input {...getInputProps()} />

      <div style={{ fontSize: '3rem', marginBottom: 16 }}>
        {isDragActive ? '📡' : hasFile ? '✅' : '🗂'}
      </div>

      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
        {isDragActive
          ? 'Drop to analyze...'
          : hasFile
            ? 'Drop new file to re-analyze'
            : 'Drag & Drop your CSV dataset'}
      </div>

      <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
        or click to browse files · CSV format only
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'Gender', icon: '👥' },
          { label: 'Age', icon: '📅' },
          { label: 'Income', icon: '💰' },
        ].map(({ label, icon }) => (
          <div key={label} className="badge badge-accent">
            {icon} {label} Detection
          </div>
        ))}
      </div>
    </div>
  )
}
