import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'grid',placeItems:'center',zIndex:20}} onClick={onClose}>
      <div style={{background:'#fff',color:'#111',minWidth:320,maxWidth:'90vw',maxHeight:'80vh',overflow:'auto',borderRadius:8,padding:16}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <h3 style={{margin:0}}>{title}</h3>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}



