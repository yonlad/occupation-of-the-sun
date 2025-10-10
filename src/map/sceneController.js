export function bindScrollScenes(map, steps) {
  const sections = steps.map((step) => {
    const el = document.querySelector(`[data-scene-id="${step.id}"]`)
    return { step, el }
  })
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('data-scene-id')
        const s = steps.find((x) => x.id === id)
        if (s?.camera) {
          map.easeTo({ ...s.camera })
        }
      }
    })
  }, { root: null, threshold: 0.6 })
  sections.forEach(({ el }) => el && io.observe(el))
  return () => io.disconnect()
}



