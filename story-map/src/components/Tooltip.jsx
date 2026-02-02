export default function Tooltip({ x, y, text, visible }) {
  if (!visible) return null
  const style = {
    position: 'absolute',
    left: x + 8,
    top: y + 8,
    background: 'rgba(40, 40, 42, 0.7)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    padding: '6px 8px',
    borderRadius: 4,
    pointerEvents: 'none',
    fontSize: 12,
    zIndex: 10,
  }
  return <div style={style}>{text}</div>
}





