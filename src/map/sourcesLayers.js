import proj4 from 'proj4'
import maplibregl from 'maplibre-gl'

// UTM zone 36N (EPSG:32636) approximates the provided CRS 32236 variant
const utm36 = '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs'
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs'

// Path to custom map pin SVG - use BASE_URL for GitHub Pages compatibility
const PIN_SVG_URL = `${import.meta.env.BASE_URL}assets/Map Pin.svg`

export async function loadSitePoints(map, sites, sourceName = 'sites', layerName = 'site-points', fitBounds = true, pinSize = 32) {
  const features = []
  const markers = []
  console.log('loadSitePoints: loading', Object.keys(sites).length, 'sites for', sourceName, 'pinSize:', pinSize)
  for (const [siteId, meta] of Object.entries(sites)) {
    const geoJsonUrl = meta.pointGeoJson.startsWith('/') 
      ? `${import.meta.env.BASE_URL}${meta.pointGeoJson.slice(1)}` 
      : `${import.meta.env.BASE_URL}${meta.pointGeoJson}`
    console.log(`loadSitePoints: fetching ${siteId} from ${geoJsonUrl}`)
    const gj = await fetch(geoJsonUrl).then(r => r.json())
    const featureRaw = gj.features?.[0] || gj
    const coords = featureRaw.geometry.coordinates
    console.log(`loadSitePoints: ${siteId} raw coords:`, coords)
    let lonlat = coords
    // Reproject if looks like meters (large numbers)
    if (Array.isArray(coords) && Math.abs(coords[0]) > 180) {
      const [x, y] = coords
      lonlat = proj4(utm36, wgs84, [x, y])
      console.log(`loadSitePoints: ${siteId} reprojected to:`, lonlat)
      console.log(`📍 IMPORTANT: ${siteId} is at longitude ${lonlat[0]}, latitude ${lonlat[1]}`)
    }
    const feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: lonlat },
      properties: { ...(featureRaw.properties || {}), siteId, name: meta.name },
    }
    features.push(feature)

    // Create HTML marker with custom SVG pin (outside canvas, unaffected by grayscale)
    const el = document.createElement('div')
    el.className = 'map-pin-marker'
    el.innerHTML = `<img src="${PIN_SVG_URL}" alt="pin" style="width:${pinSize}px;height:auto;display:block;" />`
    el.style.cursor = 'pointer'
    el.dataset.siteId = siteId
    el.dataset.name = meta.name

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(lonlat)
      .addTo(map)
    markers.push({ marker, siteId, name: meta.name, meta })
  }
  console.log('loadSitePoints: total features:', features.length)

  // Still add source/layer for potential queries (invisible)
  const collection = { type: 'FeatureCollection', features }
  if (!map.getSource(sourceName)) {
    map.addSource(sourceName, { type: 'geojson', data: collection })
    console.log('loadSitePoints: source added:', sourceName)
  } else {
    map.getSource(sourceName).setData(collection)
  }
  if (!map.getLayer(layerName)) {
    map.addLayer({
      id: layerName,
      source: sourceName,
      type: 'circle',
      paint: {
        'circle-color': '#ff0000',
        'circle-radius': 8,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0, // invisible - we use HTML markers instead
        'circle-stroke-opacity': 0, // hide stroke too
      },
    })
    console.log('loadSitePoints: layer added (invisible):', layerName)
  }

  // Fit map to all points (only if requested)
  if (fitBounds && features.length) {
    const lons = features.map(f => f.geometry.coordinates[0])
    const lats = features.map(f => f.geometry.coordinates[1])
    const bounds = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ]
    console.log('loadSitePoints: fitting bounds:', bounds)
    map.fitBounds(bounds, { padding: 80, duration: 1200 })
  }

  // Return markers so caller can attach event listeners
  return markers
}

export async function loadVideoPoints(map, videoPoints) {
  const features = []
  console.log('loadVideoPoints: loading', Object.keys(videoPoints).length, 'video points')
  for (const [pointId, meta] of Object.entries(videoPoints)) {
    const geoJsonUrl = meta.pointGeoJson.startsWith('/') 
      ? `${import.meta.env.BASE_URL}${meta.pointGeoJson.slice(1)}` 
      : `${import.meta.env.BASE_URL}${meta.pointGeoJson}`
    console.log(`loadVideoPoints: fetching ${pointId} from ${geoJsonUrl}`)
    const gj = await fetch(geoJsonUrl).then(r => r.json())
    const featureRaw = gj.features?.[0] || gj
    const coords = featureRaw.geometry.coordinates
    console.log(`loadVideoPoints: ${pointId} raw coords:`, coords)
    let lonlat = coords
    // Reproject if looks like meters (large numbers)
    if (Array.isArray(coords) && Math.abs(coords[0]) > 180) {
      const [x, y] = coords
      lonlat = proj4(utm36, wgs84, [x, y])
      console.log(`loadVideoPoints: ${pointId} reprojected to:`, lonlat)
    }
    const feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: lonlat },
      properties: { ...(featureRaw.properties || {}), pointId, name: meta.name, videoUrl: meta.videoUrl },
    }
    features.push(feature)
  }
  console.log('loadVideoPoints: total features:', features.length)
  const collection = { type: 'FeatureCollection', features }
  if (!map.getSource('video-points')) {
    map.addSource('video-points', { type: 'geojson', data: collection })
    console.log('loadVideoPoints: source added')
  } else {
    map.getSource('video-points').setData(collection)
  }
  if (!map.getLayer('video-point-layer')) {
    map.addLayer({
      id: 'video-point-layer',
      source: 'video-points',
      type: 'circle',
      paint: {
        'circle-color': '#ff2a2a',
        'circle-radius': 8,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.9,
      },
    })
    console.log('loadVideoPoints: layer added')
  }
}


