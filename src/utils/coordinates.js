import proj4 from 'proj4'

// UTM zone 36N (EPSG:32636) approximates the provided CRS 32236 variant
const utm36 = '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs'
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs'

// Al-Farsia UTM coordinates from geojson
const farsiaUTM = [736257.388465449679643, 3581171.814577243290842]
const videoUTM = [736246.243335478124209, 3581217.940914558246732]

// Convert to lon/lat
export const farsiaCoords = proj4(utm36, wgs84, farsiaUTM)
export const videoCoords = proj4(utm36, wgs84, videoUTM)

console.log('📍 Al-Farsia coordinates:', farsiaCoords)
console.log('📍 Video coordinates:', videoCoords)

