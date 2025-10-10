import proj4 from 'proj4'

// UTM zone 36N (EPSG:32636) approximates the provided CRS 32236 variant
const utm36 = '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs'
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs'

export async function loadSitePoints(map, sites) {
  const features = []
  for (const [siteId, meta] of Object.entries(sites)) {
    const gj = await fetch(meta.pointGeoJson).then(r => r.json())
    const featureRaw = gj.features?.[0] || gj
    const coords = featureRaw.geometry.coordinates
    let lonlat = coords
    // Reproject if looks like meters (large numbers)
    if (Array.isArray(coords) && Math.abs(coords[0]) > 180) {
      const [x, y] = coords
      lonlat = proj4(utm36, wgs84, [x, y])
    }
    const feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: lonlat },
      properties: { ...(featureRaw.properties || {}), siteId, name: meta.name },
    }
    features.push(feature)
  }
  const collection = { type: 'FeatureCollection', features }
  if (!map.getSource('sites')) {
    map.addSource('sites', { type: 'geojson', data: collection })
  } else {
    map.getSource('sites').setData(collection)
  }
  if (!map.getLayer('site-points')) {
    map.addLayer({
      id: 'site-points',
      source: 'sites',
      type: 'circle',
      paint: {
        'circle-color': '#ff2a2a',
        'circle-radius': 6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    })
  }

  // Fit map to all points
  if (features.length) {
    const lons = features.map(f => f.geometry.coordinates[0])
    const lats = features.map(f => f.geometry.coordinates[1])
    const bounds = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ]
    map.fitBounds(bounds, { padding: 80, duration: 1200 })
  }
}


