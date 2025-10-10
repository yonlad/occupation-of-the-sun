import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { sites } from '../data/sites.js'
import { loadSitePoints } from '../map/sourcesLayers.js'
import Tooltip from './Tooltip.jsx'
import Modal from './Modal.jsx'
import DataTable from './DataTable.jsx'

export default function MapCanvas({ onReady }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' })
  const [modal, setModal] = useState({ open: false, title: '', csvUrl: '' })

  useEffect(() => {
    const key = import.meta.env.VITE_MAPTILER_KEY
    if (!containerRef.current || mapRef.current) return
    const hasKey = key && key !== 'YOUR_MAPTILER_KEY_HERE'
    const styleUrl = hasKey
      ? `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`
      : 'https://demotiles.maplibre.org/style.json'
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [35.35, 31.8],
      zoom: 8,
      pitch: 45,
      bearing: -10,
      hash: true,
    })
    mapRef.current = map

    map.on('load', async () => {
      if (hasKey) {
        map.addSource('terrain', {
          type: 'raster-dem',
          url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${key}`,
          tileSize: 256,
        })
        map.setTerrain({ source: 'terrain', exaggeration: 1.3 })
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun-intensity': 10 },
        })
      }

      await loadSitePoints(map, sites)
      onReady?.(map)

      map.on('mousemove', 'site-points', (e) => {
        const f = e.features?.[0]
        if (!f) { setTooltip(t => ({ ...t, visible: false })); return }
        setTooltip({ visible: true, x: e.point.x, y: e.point.y, text: f.properties.name })
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'site-points', () => {
        setTooltip(t => ({ ...t, visible: false }))
        map.getCanvas().style.cursor = ''
      })
      map.on('click', 'site-points', (e) => {
        const f = e.features?.[0]
        if (!f) return
        const id = f.properties.siteId
        const meta = sites[id]
        setModal({ open: true, title: meta.name, csvUrl: meta.tableCsv })
      })
    })

    return () => {
      map.remove()
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <Tooltip {...tooltip} />
      <Modal open={modal.open} title={modal.title} onClose={() => setModal(m => ({ ...m, open: false }))}>
        <DataTable csvUrl={modal.csvUrl} />
      </Modal>
    </div>
  )
}



