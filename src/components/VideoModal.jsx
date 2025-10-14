import { useEffect } from 'react'

export default function VideoModal({ open, onClose, title, body, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(6px)',display:'grid',placeItems:'center',zIndex:20}} onClick={onClose}>
      <div 
        style={{
          background: 'rgba(40, 40, 42, 0.7)',
          color: '#fff',
          minWidth: 320,
          maxWidth: 560,
          width: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)'
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0, fontSize: 28}}>{title}</h3>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={{ 
          width: '100%', 
          height: 300, 
          background: '#1a1a1a', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: 16
        }}>
          {children || 'Video Placeholder'}
        </div>
        {body && (
          <div className="hero-body" style={{ marginTop: 16 }}>
            <p>{body}</p>
          </div>
        )}
      </div>
    </div>
  )
}


