import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import MapCanvas from './components/MapCanvas.jsx'
import { useEffect, useState } from 'react'
import stepsJson from './data/scenes/landing.json'
import { bindScrollScenes } from './map/sceneController.js'
import { useParams } from 'react-router-dom'
import { sites } from './data/sites.js'

function Layout({ children }) {
  return <div className="app">{children}</div>
}

function Home() {
  const [mapInstance, setMapInstance] = useState(null)
  useEffect(() => {
    if (!mapInstance) return
    const unbind = bindScrollScenes(mapInstance, stepsJson)
    return () => unbind?.()
  }, [mapInstance])
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="logo">logo</div>
        <nav className="landing-nav">
          <Link to="/about">About</Link>
          <Link to="/story/kalia">Story 01</Link>
        </nav>
      </header>
      <div className="landing-map">
        <MapCanvas onReady={setMapInstance} />
      </div>
      <div className="hero-card">
        <h1 className="hero-title">The Occupation of the Sun</h1>
        <h2 className="hero-subtitle">Research Project Investigating the Energy Industry in the Israeli-Occupied West Bank</h2>
        <div className="hero-body">
          <p>Since 2020, the Israeli government has been actively promoting the use of renewable energy. The Government has set ambitious targets to expand its solar energy capacity by 2030. They also recently adopted new policies to promote decentralized energy production, with solar energy playing a central role. To achieve this goal, Israel plans to increase its installed solar capacity to approximately 16GW by 2030. This expansion will involve the construction of large-scale solar farms and the promotion of rooftop solar installations across the country.</p>
          <p>While Israel promotes its green energy initiatives and environmental policies, it systematically exploits Palestinian land, water, and natural resources. This exploitation, positioned as sustainable development, has fueled the growth of Israel's solar energy industry, while carrying out the expansion of Israeli settlements and the dispossession of Palestinian lands.</p>
          <p>This is a visual study, calling attention to the structural inequality in the energy sector in the occupied West Bank, and the international companies that play an integral part in implementation of the energy apartheid.</p>
        </div>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="content">
      <h1>About</h1>
      <p>This project investigates the energy industry in the Israeli-occupied West Bank.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/story/:siteId" element={<StorySite />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

function StorySite() {
  const { siteId } = useParams()
  const meta = sites[siteId]
  const [mapInstance, setMapInstance] = useState(null)
  useEffect(() => {
    if (!mapInstance || !meta) return
    mapInstance.easeTo({ center: undefined, zoom: 10, duration: 800 })
  }, [mapInstance, meta])
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{height:'80vh'}}>
        <MapCanvas onReady={setMapInstance} />
      </div>
      <div className="content">
        <h2>{meta?.name || siteId}</h2>
        <p>Interactive story placeholder for {meta?.name || siteId}.</p>
      </div>
    </div>
  )
}
