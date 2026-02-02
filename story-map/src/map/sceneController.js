export function bindScrollScenes(map, steps, onSceneChange, options = {}) {
  const { root = null, mobileSteps = null, isMobile = false } = options
  
  // Use mobile steps if available and on mobile, otherwise use desktop steps
  const activeSteps = (isMobile && mobileSteps) ? mobileSteps : steps
  
  const sections = activeSteps.map((step) => {
    const el = document.querySelector(`[data-scene-id="${step.id}"]`)
    if (!el) console.warn(`⚠️ Scene element not found: ${step.id}`)
    return { step, el }
  })
  
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        const id = entry.target.getAttribute('data-scene-id')
        const s = activeSteps.find((x) => x.id === id)
        console.log(`📍 Scene changed to: ${id}`, s?.camera, isMobile ? '(mobile)' : '(desktop)')
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
  console.log(`✅ Observing ${sections.filter(s => s.el).length} scenes (${isMobile ? 'mobile' : 'desktop'})`)
  return () => io.disconnect()
}





