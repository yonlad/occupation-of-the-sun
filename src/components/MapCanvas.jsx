import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { sites, farsiaSites, videoPoints } from '../data/sites.js'
import { loadSitePoints, loadVideoPoints } from '../map/sourcesLayers.js'
import Tooltip from './Tooltip.jsx'
import Modal from './Modal.jsx'
import DataTable from './DataTable.jsx'
import VideoModal from './VideoModal.jsx'

// Enable RTL text plugin for Hebrew/Arabic labels on the map
let rtlPluginLoaded = false
if (!rtlPluginLoaded) {
  maplibregl.setRTLTextPlugin(
    'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
    (err) => {
      if (err) {
        console.error('RTL plugin failed to load:', err)
      } else {
        console.log('RTL plugin loaded successfully')
      }
    },
    true // lazy load
  )
  rtlPluginLoaded = true
}

export default function MapCanvas({ onReady, onDotClick, grayscale = false, showVideoPoints = false, scrollContainer = null, visibleSiteIds = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const visibleSiteIdsRef = useRef(visibleSiteIds) // Track current value for async access
  const [markersReady, setMarkersReady] = useState(false) // Track when markers are loaded
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' })
  const [modal, setModal] = useState({ open: false, title: '', csvUrl: '', type: 'data' })
  // const videoListenersAttachedRef = useRef(false)
  // const [videoModal, setVideoModal] = useState({ open: false, title: '', body: '' })

  useEffect(() => {
    const key = import.meta.env.VITE_MAPTILER_KEY
    console.log('MapCanvas: initializing, key present:', !!key, 'container:', !!containerRef.current, 'existing map:', !!mapRef.current)
    if (!containerRef.current) {
      console.error('MapCanvas: container ref not available')
      return
    }
    if (mapRef.current) {
      console.log('MapCanvas: map already exists, skipping')
      return
  
    }
    const hasKey = key && key !== 'YOUR_MAPTILER_KEY_HERE'
    const styleUrl = hasKey
      ? `https://api.maptiler.com/maps/satellite/style.json?key=${key}`
      : 'https://demotiles.maplibre.org/style.json'
    console.log('MapCanvas: using style URL:', styleUrl.replace(key || '', 'XXXX'))
    console.log('MapCanvas: creating map instance...')
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [35.35, 31.8],
      zoom: 8,
      pitch: 45,
      bearing: -10,
      hash: true,
      scrollZoom: false, // Disable scroll zoom initially
    })
    mapRef.current = map
    console.log('MapCanvas: map instance created')

    map.on('error', (e) => {
      console.error('MapLibre error:', e.error)
    })

    map.on('load', async () => {
      console.log('MapCanvas: map loaded')
      if (hasKey) {
        try {
          map.addSource('terrain', {
            type: 'raster-dem',
            url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${key}`,
            tileSize: 256,
          })
          map.setTerrain({ source: 'terrain', exaggeration: 1.3 })
          console.log('MapCanvas: terrain added')
        } catch (e) {
          console.error('MapCanvas: terrain setup error:', e)
        }
      }

      // Add West Bank overlay - hidden by default, shown only on sub-intro scene
      try {
        const westBankCoords = [
          [34.737255684304955, 32.56348699254539],  // top-left
          [35.57650523264138, 32.56348699254539],   // top-right
          [35.57650523264138, 31.31355578154553],   // bottom-right
          [34.737255684304955, 31.31355578154553]   // bottom-left
        ]

        map.addSource('west-bank-overlay', {
          type: 'image',
          url: `${import.meta.env.BASE_URL}assets/west-bank-4.png`,
          coordinates: westBankCoords
        })

        map.addLayer({
          id: 'west-bank-overlay-layer',
          type: 'raster',
          source: 'west-bank-overlay',
          layout: {
            visibility: 'none'  // Hidden by default
          },
          paint: {
            'raster-opacity': 1
          }
        })
        console.log('MapCanvas: West Bank overlay added (hidden)')
      } catch (e) {
        console.error('MapCanvas: West Bank overlay setup error:', e)
      }

      try {
        // Use smaller pins on landing page (grayscale mode)
        const pinSize = grayscale ? 16 : 23
        console.log('MapCanvas: loading site points with pinSize:', pinSize, 'grayscale:', grayscale)
        const markers = await loadSitePoints(map, sites, 'sites', 'site-points', true, pinSize)
        markersRef.current = markers
        console.log('MapCanvas: site points loaded')

        // Attach event listeners to HTML marker elements
        markers.forEach(({ marker, siteId, name, meta }) => {
          const el = marker.getElement()
          el.addEventListener('mouseenter', (e) => {
            const rect = el.getBoundingClientRect()
            const mapRect = containerRef.current.getBoundingClientRect()
            setTooltip({ visible: true, x: rect.left - mapRect.left + rect.width / 2, y: rect.top - mapRect.top, text: name })
          })
          el.addEventListener('mouseleave', () => {
            setTooltip(t => ({ ...t, visible: false }))
          })
          el.addEventListener('click', () => {
            setModal({ open: true, title: meta.name, csvUrl: meta.tableCsv, type: 'data' })
            onDotClick?.()
          })
        })

        // Apply initial visibility based on current visibleSiteIds
        const currentVisible = visibleSiteIdsRef.current
        console.log('MapCanvas: applying initial visibility, visibleSiteIds:', currentVisible)
        markers.forEach(({ marker, siteId }) => {
          const el = marker.getElement()
          if (currentVisible.includes(siteId)) {
            el.style.display = ''
          } else {
            el.style.display = 'none'
          }
        })
        
        setMarkersReady(true)
        // Expose map and utility methods to parent
        onReady?.({
          map,
          showWestBankOverlay: (visible) => {
            if (map.getLayer('west-bank-overlay-layer')) {
              map.setLayoutProperty('west-bank-overlay-layer', 'visibility', visible ? 'visible' : 'none')
              console.log('MapCanvas: West Bank overlay visibility:', visible ? 'visible' : 'none')
            }
          }
        })

        /*
        // Also load video points using the same pattern so the red dot renders
        console.log('MapCanvas: loading video points (initial)...')
        await loadVideoPoints(map, videoPoints)
        console.log('MapCanvas: video points loaded (initial)')
        */
      } catch (e) {
        console.error('MapCanvas: site points error:', e)
      }
    })

    return () => {
      map.remove()
    }
  }, [])

  // Forward wheel/touch scroll on the map canvas to the provided scroll container
  useEffect(() => {
    if (!mapRef.current || !scrollContainer) return
    const canvas = mapRef.current.getCanvas()

    const onWheel = (e) => {
      // Allow cmd/ctrl + wheel zoom gesture to still work if desired
      if (e.ctrlKey || e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY
      try {
        scrollContainer.scrollBy({ top: delta, behavior: 'auto' })
      } catch {}
    }

    let touchStartY = null
    const onTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartY = e.touches[0].clientY
      }
    }
    const onTouchMove = (e) => {
      if (touchStartY == null) return
      const currentY = e.touches[0].clientY
      const delta = touchStartY - currentY
      if (Math.abs(delta) > 0) {
        e.preventDefault()
        try {
          scrollContainer.scrollBy({ top: delta, behavior: 'auto' })
        } catch {}
      }
    }
    const onTouchEnd = () => { touchStartY = null }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [scrollContainer])
/*
  // Load farsia and video points when showVideoPoints becomes true
  useEffect(() => {
    if (!mapRef.current || !showVideoPoints) return
    const map = mapRef.current
    
    const loadFarsiaAndVideo = async () => {
      try {
        // Load farsia site points
        console.log('🔵 MapCanvas: loading farsia points...')
        await loadSitePoints(map, farsiaSites, 'farsia-sites', 'farsia-points', false)
        console.log('🔵 MapCanvas: farsia points loaded successfully')

        // Load video points
        console.log('🔴 MapCanvas: loading video points...')
        await loadVideoPoints(map, videoPoints)
        console.log('🔴 MapCanvas: video points loaded successfully')
      } catch (e) {
        console.error('❌ MapCanvas: farsia/video points error:', e)
      }
    }

    const handleFarsiaMouseMove = (e) => {
      const f = e.features?.[0]
      if (!f) { setTooltip(t => ({ ...t, visible: false })); return }
      setTooltip({ visible: true, x: e.point.x, y: e.point.y, text: f.properties.name })
      map.getCanvas().style.cursor = 'pointer'
    }
    
    const handleFarsiaMouseLeave = () => {
      setTooltip(t => ({ ...t, visible: false }))
      map.getCanvas().style.cursor = ''
    }
    
    const handleFarsiaClick = (e) => {
      const f = e.features?.[0]
      if (!f) return
      onDotClick?.()
    }

    const handleVideoMouseMove = (e) => {
      const f = e.features?.[0]
      if (!f) { setTooltip(t => ({ ...t, visible: false })); return }
      setTooltip({ visible: true, x: e.point.x, y: e.point.y, text: f.properties.name })
      map.getCanvas().style.cursor = 'pointer'
    }
    
    const handleVideoMouseLeave = () => {
      setTooltip(t => ({ ...t, visible: false }))
      map.getCanvas().style.cursor = ''
    }
    
    const handleVideoClick = (e) => {
      const f = e.features?.[0]
      if (!f) return
      const id = f.properties.pointId
      const meta = videoPoints[id]
      if (meta?.hero) {
        setVideoModal({ open: true, title: meta.hero.title, body: meta.hero.body })
      } else {
        setVideoModal({ open: true, title: 'Video', body: '' })
      }
    }

    // Setup event listeners after loading
    const setupListeners = () => {
      if (map.getLayer('farsia-points')) {
        map.on('mousemove', 'farsia-points', handleFarsiaMouseMove)
        map.on('mouseleave', 'farsia-points', handleFarsiaMouseLeave)
        map.on('click', 'farsia-points', handleFarsiaClick)
      }
      
      if (map.getLayer('video-point-layer')) {
        // Ensure video points sit above others for interaction priority
        try { map.moveLayer('video-point-layer') } catch {}
        map.on('mousemove', 'video-point-layer', handleVideoMouseMove)
        map.on('mouseleave', 'video-point-layer', handleVideoMouseLeave)
        map.on('click', 'video-point-layer', handleVideoClick)
        videoListenersAttachedRef.current = true
      }
    }

    // Load points and setup listeners
    if (map.loaded()) {
      loadFarsiaAndVideo().then(setupListeners)
    } else {
      map.once('load', () => {
        loadFarsiaAndVideo().then(setupListeners)
      })
    }

    // Cleanup
    return () => {
      if (map.getLayer('farsia-points')) {
        map.off('mousemove', 'farsia-points', handleFarsiaMouseMove)
        map.off('mouseleave', 'farsia-points', handleFarsiaMouseLeave)
        map.off('click', 'farsia-points', handleFarsiaClick)
      }
      
      if (map.getLayer('video-point-layer')) {
        map.off('mousemove', 'video-point-layer', handleVideoMouseMove)
        map.off('mouseleave', 'video-point-layer', handleVideoMouseLeave)
        map.off('click', 'video-point-layer', handleVideoClick)
      }
    }
  }, [showVideoPoints])
*/
  // Apply grayscale filter and update marker sizes when grayscale prop changes
  useEffect(() => {
    if (!mapRef.current) return
    const canvas = mapRef.current.getCanvas()
    if (grayscale) {
      canvas.style.filter = 'grayscale(100%) contrast(0.9)'
    } else {
      canvas.style.filter = ''
    }
    // Update marker pin sizes based on grayscale mode
    const pinSize = grayscale ? 16 : 23
    markersRef.current.forEach(({ marker }) => {
      const img = marker.getElement().querySelector('img')
      if (img) {
        img.style.width = `${pinSize}px`
      }
    })
  }, [grayscale])

  // Keep ref in sync with prop for async access
  useEffect(() => {
    visibleSiteIdsRef.current = visibleSiteIds
  }, [visibleSiteIds])

  // Show/hide markers based on visibleSiteIds (only after markers are ready)
  useEffect(() => {
    if (!markersReady) return
    console.log('MapCanvas: updating visibility, visibleSiteIds:', visibleSiteIds)
    markersRef.current.forEach(({ marker, siteId }) => {
      const el = marker.getElement()
      if (visibleSiteIds.includes(siteId)) {
        el.style.display = ''
      } else {
        el.style.display = 'none'
      }
    })
  }, [visibleSiteIds, markersReady])

  /*
  // Fallback: ensure video layer has listeners once available
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const tryAttach = () => {
      if (videoListenersAttachedRef.current) return
      if (!map.getLayer('video-point-layer')) return
      try { map.moveLayer('video-point-layer') } catch {}
      map.on('mousemove', 'video-point-layer', (e) => {
        const f = e.features?.[0]
        if (!f) { setTooltip(t => ({ ...t, visible: false })); return }
        setTooltip({ visible: true, x: e.point.x, y: e.point.y, text: f.properties.name })
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'video-point-layer', () => {
        setTooltip(t => ({ ...t, visible: false }))
        map.getCanvas().style.cursor = ''
      })
      map.on('click', 'video-point-layer', (e) => {
        const f = e.features?.[0]
        if (!f) return
        const id = f.properties.pointId
        const meta = videoPoints[id]
        if (meta?.hero) {
          setVideoModal({ open: true, title: meta.hero.title, body: meta.hero.body })
        } else {
          setVideoModal({ open: true, title: 'Video', body: '' })
        }
      })
      videoListenersAttachedRef.current = true
    }
    map.on('idle', tryAttach)
    return () => {
      map.off('idle', tryAttach)
      if (videoListenersAttachedRef.current && map.getLayer('video-point-layer')) {
        map.off('mousemove', 'video-point-layer', () => {})
        map.off('mouseleave', 'video-point-layer', () => {})
        map.off('click', 'video-point-layer', () => {})
      }
    }
  }, [])
*/

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <Tooltip {...tooltip} />
      <Modal open={modal.open} title={modal.title} onClose={() => setModal(m => ({ ...m, open: false }))}>
        {modal.type === 'data' ? (
          <DataTable csvUrl={modal.csvUrl} />
        ) : (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ 
              width: '100%', 
              height: '400px', 
              background: '#1a1a1a', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: '16px'
            }}>
              Video Placeholder
            </div>
            <p style={{ marginTop: '16px', color: '#ddd' }}>
              This will be replaced with an actual video player
            </p>
          </div>
        )}
      </Modal>
      {/*<VideoModal open={videoModal.open} title={videoModal.title} body={videoModal.body} onClose={() => setVideoModal(m => ({ ...m, open: false }))} />*/}
    </div>
  )
}



