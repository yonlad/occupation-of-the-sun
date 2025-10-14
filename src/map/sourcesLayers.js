import proj4 from 'proj4'

// UTM zone 36N (EPSG:32636) approximates the provided CRS 32236 variant
const utm36 = '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs'
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs'

export async function loadSitePoints(map, sites, sourceName = 'sites', layerName = 'site-points', fitBounds = true) {
  const features = []
  console.log('loadSitePoints: loading', Object.keys(sites).length, 'sites for', sourceName)
  for (const [siteId, meta] of Object.entries(sites)) {
    console.log(`loadSitePoints: fetching ${siteId} from ${meta.pointGeoJson}`)
    const gj = await fetch(meta.pointGeoJson).then(r => r.json())
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
  }
  console.log('loadSitePoints: total features:', features.length)
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
        'circle-color': '#ff2a2a',
        'circle-radius': 8,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    })
    console.log('loadSitePoints: layer added:', layerName)
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
}

export async function loadVideoPoints(map, videoPoints) {
  const features = []
  console.log('loadVideoPoints: loading', Object.keys(videoPoints).length, 'video points')
  for (const [pointId, meta] of Object.entries(videoPoints)) {
    console.log(`loadVideoPoints: fetching ${pointId} from ${meta.pointGeoJson}`)
    const gj = await fetch(meta.pointGeoJson).then(r => r.json())
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


