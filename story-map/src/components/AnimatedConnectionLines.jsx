import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'

/**
 * Configuration for animated connection lines between locations.
 * Each scene can have multiple lines that animate when the scene becomes active.
 * 
 * Israel coordinates: [35.2, 31.5] (central Israel/West Bank area)
 * 
 * You can easily add more lines by adding new scene IDs or destinations:
 * - Add a new scene ID key with an array of line configurations
 * - Each line needs: id (unique), from, to, color, width, delay
 */
export const connectionLinesConfig = {
  // Scene 1: SolarEdge - USA (New York City)
  'globe-scene': [
    {
      id: 'israel-nyc',
      from: { coords: [35.2, 31.5], label: 'Israel' },
      to: { coords: [-74.006, 40.7128], label: 'New York City' },
      color: '#ED2024',
      width: 1.5,
      delay: 2000,
    },
    {
        id: 'israel-beijing',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [116.4074, 39.9042], label: 'Beijing' },
        color: '#ED2024',
        width: 1.5,
        delay: 2200,
    },
    {
        id: 'israel-Canberra',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [149.1300, -35.2809], label: 'Canberra' },
        color: '#ED2024',
        width: 1.5,
        delay: 2400,
    },
    {
        id: 'israel-NewDelhi',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [77.2090, 28.6139], label: 'New Delhi' },
        color: '#ED2024',
        width: 1.5,
        delay: 2600,
    },
    {
        id: 'israel-Tokyo',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [139.7671, 35.6812], label: 'Tokyo' },
        color: '#ED2024',
        width: 1.5,
        delay: 2800,
    },
    {
        id: 'israel-Singapore',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [103.8198, 1.3521], label: 'Singapore' },
        color: '#ED2024',
        width: 1.5,
        delay: 3000,
    },
    {
        id: 'israel-Ankara',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [32.8663, 39.9255], label: 'Ankara' },
        color: '#ED2024',
        width: 1.5,
        delay: 3200,
    },
    {
        id: 'israel-London',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [-0.1278, 51.5074], label: 'London' },
        color: '#ED2024',
        width: 1.5,
        delay: 3400,
    },

      
  ],
  
  // Scene 2: EDF - France (Paris)
  'globe-scene-2': [
    {
      id: 'israel-paris',
      from: { coords: [35.2, 31.5], label: 'Israel' },
      to: { coords: [2.3522, 48.8566], label: 'Paris' },
      color: '#ED2024',
      width: 1.5,
      delay: 300,
    },
  ],
  
  // Scene 3: Enerpoint - Italy (Rome)
  'globe-scene-3': [
    {
      id: 'israel-rome',
      from: { coords: [35.2, 31.5], label: 'Israel' },
      to: { coords: [12.4964, 41.9028], label: 'Rome' },
      color: '#ED2024',
      width: 1.5,
      delay: 300,
    },
  ],
  
  // Scene 4: Siemens - Germany (Berlin)
  'globe-scene-4': [
    {
      id: 'israel-berlin',
      from: { coords: [35.2, 31.5], label: 'Israel' },
      to: { coords: [13.405, 52.52], label: 'Berlin' },
      color: '#ED2024',
      width: 1.5,
      delay: 300,
    },
  ],
  
  // Scene 5: Multiple global companies - show all connections
  'globe-scene-5': [
    {
      id: 'israel-arizona',
      from: { coords: [35.2, 31.5], label: 'Israel' },
      to: { coords: [-111.0937, 33.4484], label: 'Arizona' },
      color: '#ED2024',
      width: 1.5,
      delay:100,
    },
    {
      id: 'israel-wuxi',
      from: { coords: [35.2, 31.5], label: 'Israel' },
      to: { coords: [120.2994, 31.4912], label: 'Wuxi' },
      color: '#ED2024',
      width: 1.5,
      delay: 300,
    },
    {
        id: 'israel-zurich',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [8.5417, 47.3769], label: 'Zurich' },
        color: '#ED2024',
        width: 1.5,
        delay: 600,
    },
    {
        id: 'israel-stockholm',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [18.0686, 59.3293], label: 'Stockholm' },
        color: '#ED2024',
        width: 1.5,
        delay: 900,
    },
    {
        id: 'israel-Niestetal',
        from: { coords: [35.2, 31.5], label: 'Israel' },
        to: { coords: [9.7167, 51.2333], label: 'Niestetal' },
        color: '#ED2024',
        width: 1.5,
        delay: 0,
    },
  ],
}

// List of all globe scene IDs for visibility checking
const GLOBE_SCENES = ['globe-scene', 'globe-scene-2', 'globe-scene-3', 'globe-scene-4', 'globe-scene-5']

/**
 * Generates intermediate points along a great circle path between two coordinates.
 * This creates a curved line that follows the Earth's surface.
 */
function generateGreatCirclePath(from, to, numPoints = 100) {
  const [lon1, lat1] = from
  const [lon2, lat2] = to
  
  const toRad = (deg) => (deg * Math.PI) / 180
  const toDeg = (rad) => (rad * 180) / Math.PI
  
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const lambda1 = toRad(lon1)
  const lambda2 = toRad(lon2)
  
  const points = []
  
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints
    
    // Spherical linear interpolation (slerp)
    const d = Math.acos(
      Math.sin(phi1) * Math.sin(phi2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1)
    )
    
    if (d === 0) {
      points.push([lon1, lat1])
      continue
    }
    
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    
    const x = A * Math.cos(phi1) * Math.cos(lambda1) + B * Math.cos(phi2) * Math.cos(lambda2)
    const y = A * Math.cos(phi1) * Math.sin(lambda1) + B * Math.cos(phi2) * Math.sin(lambda2)
    const z = A * Math.sin(phi1) + B * Math.sin(phi2)
    
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))
    const lon = toDeg(Math.atan2(y, x))
    
    points.push([lon, lat])
  }
  
  return points
}

/**
 * Creates an HTML marker element using the Map Pin SVG
 */
function createPinMarkerElement(size = 16) {
  const el = document.createElement('div')
  el.className = 'connection-line-marker' // Add class for identification
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.pointerEvents = 'none'
  el.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="27" cy="27" r="26.8" fill="#ED2024" fill-opacity="0.3" stroke="#ED2024" stroke-width="0.4"/>
      <circle cx="27" cy="27" r="20" fill="#ED2024" fill-opacity="0.6"/>
      <circle cx="27" cy="27" r="13" fill="#ED2024"/>
    </svg>
  `
  return el
}

/**
 * Creates an SVG overlay container for drawing lines
 */
function createSvgOverlay(mapContainer) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('id', 'connection-lines-overlay')
  svg.style.position = 'absolute'
  svg.style.top = '0'
  svg.style.left = '0'
  svg.style.width = '100%'
  svg.style.height = '100%'
  svg.style.pointerEvents = 'none'
  svg.style.zIndex = '1' // Above the canvas but below markers
  svg.style.overflow = 'visible'
  
  // Insert after the canvas but before markers
  const canvas = mapContainer.querySelector('.maplibregl-canvas-container')
  if (canvas && canvas.parentNode) {
    canvas.parentNode.insertBefore(svg, canvas.nextSibling)
  } else {
    mapContainer.appendChild(svg)
  }
  
  return svg
}

/**
 * Hook that manages animated connection lines on a MapLibre map.
 * Uses HTML/SVG overlay so lines appear colored even on grayscale map.
 * Lines accumulate across globe scenes and are only cleaned when leaving the globe scene sequence.
 */
export function useAnimatedConnectionLines(map, currentScene, isActive = true) {
  const activeAnimationsRef = useRef({})
  const markersRef = useRef({}) // Store MapLibre markers by line ID
  const svgOverlayRef = useRef(null)
  const pathsRef = useRef({}) // Store SVG path elements by line ID
  const previousSceneRef = useRef(null)
  const drawnLinesRef = useRef(new Set()) // Track which lines have been drawn
  const completedLinesRef = useRef(new Set()) // Track which lines have completed animation
  const isInGlobeSequenceRef = useRef(false) // Track if we're in globe sequence
  
  // Check if current scene is a globe scene
  const isGlobeScene = GLOBE_SCENES.includes(currentScene)
  
  // Get or create SVG overlay
  const getSvgOverlay = useCallback(() => {
    if (!map) return null
    
    const container = map.getContainer()
    let svg = container.querySelector('#connection-lines-overlay')
    
    if (!svg) {
      svg = createSvgOverlay(container)
      svgOverlayRef.current = svg
    }
    
    return svg
  }, [map])
  
  // Clean up everything - called only when leaving globe scenes entirely
  const cleanupAll = useCallback(() => {
    // Cancel all animations and timeouts
    Object.keys(activeAnimationsRef.current).forEach((key) => {
      if (key.endsWith('-timeout')) {
        clearTimeout(activeAnimationsRef.current[key])
      } else {
        cancelAnimationFrame(activeAnimationsRef.current[key])
      }
    })
    activeAnimationsRef.current = {}
    
    // Remove all markers
    Object.values(markersRef.current).forEach((markerPair) => {
      if (markerPair.from) markerPair.from.remove()
      if (markerPair.to) markerPair.to.remove()
    })
    markersRef.current = {}
    
    // Remove all SVG paths
    Object.values(pathsRef.current).forEach((pathGroup) => {
      if (pathGroup.glow) pathGroup.glow.remove()
      if (pathGroup.main) pathGroup.main.remove()
    })
    pathsRef.current = {}
    
    // Remove SVG overlay if exists
    if (svgOverlayRef.current) {
      svgOverlayRef.current.remove()
      svgOverlayRef.current = null
    }
    
    // Clear drawn lines tracking
    drawnLinesRef.current.clear()
    completedLinesRef.current.clear()
    
    // Mark that we left the globe sequence
    isInGlobeSequenceRef.current = false
  }, [])
  
  // Convert geo coords to screen coords using map projection
  const projectPath = useCallback((geoPath) => {
    if (!map) return []
    return geoPath.map(([lng, lat]) => {
      const point = map.project([lng, lat])
      return [point.x, point.y]
    })
  }, [map])
  
  // Create SVG path string from screen coordinates
  const createPathString = useCallback((screenPoints) => {
    if (screenPoints.length === 0) return ''
    
    let d = `M ${screenPoints[0][0]} ${screenPoints[0][1]}`
    for (let i = 1; i < screenPoints.length; i++) {
      d += ` L ${screenPoints[i][0]} ${screenPoints[i][1]}`
    }
    return d
  }, [])
  
  // Animate a single line (only if not already drawn)
  const animateLine = useCallback((lineConfig, onComplete) => {
    if (!map) return
    
    const { id, from, to, color = '#ED2024', width = 2.5, delay = 0 } = lineConfig
    
    // Skip if this line has already been drawn in this globe sequence
    if (drawnLinesRef.current.has(id)) {
      return
    }
    
    // Mark this line as being drawn
    drawnLinesRef.current.add(id)
    
    const svg = getSvgOverlay()
    if (!svg) return
    
    // Generate the full great circle path
    const fullGeoPath = generateGreatCirclePath(from.coords, to.coords, 100)
    
    // Create glow path element (hidden initially - no 'd' attribute)
    const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    glowPath.setAttribute('fill', 'none')
    glowPath.setAttribute('stroke', color)
    glowPath.setAttribute('stroke-width', String(width * 3))
    glowPath.setAttribute('stroke-opacity', '0.3')
    glowPath.setAttribute('stroke-linecap', 'round')
    glowPath.setAttribute('stroke-linejoin', 'round')
    glowPath.style.filter = 'blur(3px)'
    // Don't set 'd' yet - keep it invisible until animation starts
    svg.appendChild(glowPath)
    
    // Create main path element (hidden initially)
    const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    mainPath.setAttribute('fill', 'none')
    mainPath.setAttribute('stroke', color)
    mainPath.setAttribute('stroke-width', String(width))
    mainPath.setAttribute('stroke-linecap', 'round')
    mainPath.setAttribute('stroke-linejoin', 'round')
    // Don't set 'd' yet
    svg.appendChild(mainPath)
    
    pathsRef.current[id] = { glow: glowPath, main: mainPath }
    
    // Create origin marker (hidden initially)
    const fromEl = createPinMarkerElement(16)
    fromEl.style.opacity = '0'
    fromEl.style.transition = 'opacity 0.3s ease'
    const fromMarker = new maplibregl.Marker({ element: fromEl })
      .setLngLat(from.coords)
      .addTo(map)
    
    // Create destination marker (hidden initially)
    const toEl = createPinMarkerElement(16)
    toEl.style.opacity = '0'
    toEl.style.transition = 'opacity 0.3s ease'
    const toMarker = new maplibregl.Marker({ element: toEl })
      .setLngLat(to.coords)
      .addTo(map)
    
    markersRef.current[id] = { from: fromMarker, to: toMarker }
    
    // Animation parameters
    const duration = 2000
    let startTime = null
    let currentPointIndex = 0
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      
      const targetIndex = Math.floor(easedProgress * (fullGeoPath.length - 1))
      
      if (targetIndex > currentPointIndex || progress === 1) {
        currentPointIndex = Math.max(targetIndex, 1)
        
        // Get current portion of path and project to screen
        const currentGeoPath = fullGeoPath.slice(0, currentPointIndex + 1)
        const screenPath = projectPath(currentGeoPath)
        const pathString = createPathString(screenPath)
        
        glowPath.setAttribute('d', pathString)
        mainPath.setAttribute('d', pathString)
        
        // Show origin marker early
        if (progress > 0.05) {
          fromEl.style.opacity = '1'
        }
        
        // Show destination marker near end
        if (progress > 0.9) {
          toEl.style.opacity = '1'
        }
      }
      
      if (progress < 1) {
        activeAnimationsRef.current[id] = requestAnimationFrame(animate)
      } else {
        // Final state
        const finalScreenPath = projectPath(fullGeoPath)
        const finalPathString = createPathString(finalScreenPath)
        glowPath.setAttribute('d', finalPathString)
        mainPath.setAttribute('d', finalPathString)
        fromEl.style.opacity = '1'
        toEl.style.opacity = '1'
        
        // Mark line as completed - now it can be updated by updatePaths
        completedLinesRef.current.add(id)
        
        delete activeAnimationsRef.current[id]
        onComplete?.()
      }
    }
    
    // Start animation after delay
    const timeoutId = setTimeout(() => {
      activeAnimationsRef.current[id] = requestAnimationFrame(animate)
    }, delay)
    
    // Store timeout for cleanup
    activeAnimationsRef.current[`${id}-timeout`] = timeoutId
    
  }, [map, getSvgOverlay, projectPath, createPathString])
  
  // Update paths when map moves (for camera changes)
  // Only updates lines that have COMPLETED their animation (not pending/animating ones)
  const updatePaths = useCallback(() => {
    Object.entries(pathsRef.current).forEach(([id, pathGroup]) => {
      // Skip lines that haven't completed their animation yet
      // This prevents the "flash" of complete line before animation starts
      if (!completedLinesRef.current.has(id)) {
        return
      }
      
      // Find the config for this line
      let lineConfig = null
      for (const sceneId of GLOBE_SCENES) {
        const lines = connectionLinesConfig[sceneId]
        if (lines) {
          lineConfig = lines.find(l => l.id === id)
          if (lineConfig) break
        }
      }
      
      if (lineConfig) {
        const fullGeoPath = generateGreatCirclePath(lineConfig.from.coords, lineConfig.to.coords, 100)
        const screenPath = projectPath(fullGeoPath)
        const pathString = createPathString(screenPath)
        
        if (pathGroup.glow) pathGroup.glow.setAttribute('d', pathString)
        if (pathGroup.main) pathGroup.main.setAttribute('d', pathString)
      }
    })
  }, [projectPath, createPathString])
  
  // Listen to map move events to update paths
  useEffect(() => {
    if (!map || !isGlobeScene) return
    
    const handleMove = () => updatePaths()
    map.on('move', handleMove)
    
    return () => {
      map.off('move', handleMove)
    }
  }, [map, isGlobeScene, updatePaths])
  
  // Main effect: handle scene changes
  useEffect(() => {
    if (!map || !isActive) return
    
    const previousScene = previousSceneRef.current
    const wasGlobeScene = GLOBE_SCENES.includes(previousScene)
    previousSceneRef.current = currentScene
    
    // Entering globe scenes for the first time
    if (isGlobeScene && !wasGlobeScene) {
      isInGlobeSequenceRef.current = true
    }
    
    // Leaving globe scenes entirely
    if (!isGlobeScene && wasGlobeScene) {
      cleanupAll()
      return
    }
    
    // Not in globe scene and wasn't before - nothing to do
    if (!isGlobeScene) {
      return
    }
    
    // We're in a globe scene - animate the lines for this scene
    // Lines accumulate (we don't cleanup between globe scenes)
    const lines = connectionLinesConfig[currentScene]
    
    if (lines && lines.length > 0) {
      // Animate each line (animateLine will skip already-drawn lines)
      lines.forEach((lineConfig) => {
        animateLine(lineConfig)
      })
    }
    
    // No cleanup function here - we only cleanup when leaving globe scenes entirely
    // This is handled by the explicit check above
    
  }, [map, currentScene, isActive, isGlobeScene, animateLine, cleanupAll])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAll()
    }
  }, [cleanupAll])
  
  return {
    animateLine,
    cleanupAll,
    isGlobeScene,
  }
}

// Easing function for smooth animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Component wrapper for the animated connection lines hook.
 * Use this when you need to add lines to an existing map component.
 */
export default function AnimatedConnectionLines({ map, currentScene, isActive = true }) {
  useAnimatedConnectionLines(map, currentScene, isActive)
  return null
}
