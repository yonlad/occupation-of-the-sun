export function bindScrollScenes(map, steps, onSceneChange, options = {}) {
  const { root = null } = options
  const sections = steps.map((step) => {
    const el = document.querySelector(`[data-scene-id="${step.id}"]`)
    if (!el) console.warn(`⚠️ Scene element not found: ${step.id}`)
    return { step, el }
  })
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        const id = entry.target.getAttribute('data-scene-id')
        const s = steps.find((x) => x.id === id)
        console.log(`📍 Scene changed to: ${id}`, s?.camera)
        if (s?.camera) {
          map.easeTo({ ...s.camera })
        }
        // Notify parent component of scene change
        if (onSceneChange) {
          onSceneChange(id)
        }
      }
    })
  }, { root, threshold: 0.5 })
  sections.forEach(({ el }) => el && io.observe(el))
  console.log(`✅ Observing ${sections.filter(s => s.el).length} scenes`)
  return () => io.disconnect()
}





