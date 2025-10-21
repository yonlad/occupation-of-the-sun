import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import MapCanvas from './components/MapCanvas.jsx'
import { useEffect, useState, useRef } from 'react'
import farsiaSteps from './data/scenes/farsia.json'
import { bindScrollScenes } from './map/sceneController.js'
// removed unused imports for Story route and site registries

function Layout({ children }) {
  return <div className="app">{children}</div>
}

function Home() {
  const [mapInstance, setMapInstance] = useState(null)
  const [currentScene, setCurrentScene] = useState('intro')
  const [storyStarted, setStoryStarted] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)
  const landingRef = useRef(null)
  const suppressIntroHeroOnceRef = useRef(false)
  
  const handleStartClick = () => {
    suppressIntroHeroOnceRef.current = true
    setHeroVisible(false)
    setStoryStarted(true)
    document.querySelector('[data-scene-id="farsia-village"]')?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleDotClick = () => {
    setHeroVisible(false)
  }
  
  useEffect(() => {
    if (!mapInstance) return
    const unbind = bindScrollScenes(mapInstance, farsiaSteps, (sceneId) => {
      console.log('🎬 Scene changed:', sceneId, 'storyStarted:', storyStarted)
      setCurrentScene(sceneId)
      // Auto-start story when scrolling to farsia scene
      if (sceneId === 'farsia-village' && !storyStarted) {
        console.log('🚀 Auto-starting story!')
        setStoryStarted(true)
      }
      // If user returns to intro, show hero again unless suppressed for the immediate transition
      if (sceneId === 'intro') {
        if (suppressIntroHeroOnceRef.current) {
          suppressIntroHeroOnceRef.current = false
        } else {
          setHeroVisible(true)
        }
      }
    }, { root: landingRef.current || null })
    return () => unbind?.()
  }, [mapInstance, storyStarted])
  
  // Debug logging
  useEffect(() => {
    console.log('🔄 State update - storyStarted:', storyStarted, 'currentScene:', currentScene)
  }, [storyStarted, currentScene])
  
  // No-op: overlay doesn't need artificial height; scenes equal 100vh sections
  
  return (
    <div className="landing" ref={landingRef}>
      <header className="landing-header">
        <div className="logo">logo</div>
        <nav className="landing-nav">
          <Link to="/about">About</Link>
          <button onClick={handleStartClick} className="start-button">Start</button>
        </nav>
      </header>
      <div className="landing-map">
        <MapCanvas 
          onReady={setMapInstance} 
          showVideoPoints={currentScene === 'farsia-village'} 
          grayscale={currentScene === 'intro'}
          onDotClick={handleDotClick}
          scrollContainer={landingRef.current}
        />
      </div>
      
      <div className="scroll-container">
        {/* Intro scene - landing hero */}
        <div data-scene-id="intro" className="scroll-section">
          {heroVisible && (
            <div className="hero-card">
              <h1 className="hero-title">The Occupation of the Sun</h1>
              <h2 className="hero-subtitle">Research Project Investigating the Energy Industry in the Israeli-Occupied West Bank</h2>
              <div className="hero-body">
                <p>Since 2020, the Israeli government has been actively promoting the use of renewable energy. The Government has set ambitious targets to expand its solar energy capacity by 2030. They also recently adopted new policies to promote decentralized energy production, with solar energy playing a central role. To achieve this goal, Israel plans to increase its installed solar capacity to approximately 16GW by 2030. This expansion will involve the construction of large-scale solar farms and the promotion of rooftop solar installations across the country.</p>
                <p>While Israel promotes its green energy initiatives and environmental policies, it systematically exploits Palestinian land, water, and natural resources. This exploitation, positioned as sustainable development, has fueled the growth of Israel's solar energy industry, while carrying out the expansion of Israeli settlements and the dispossession of Palestinian lands.</p>
                <p>This is a visual study, calling attention to the structural inequality in the energy sector in the occupied West Bank, and the international companies that play an integral part in implementation of the energy apartheid.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Al-Farsia village scene */}
        <div data-scene-id="farsia-village" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Al - Farsia Story</h1>
              <div className="hero-body">
                <p>The word "village" may be an overstatement. Farj'a Nabaa al-Ghazzal is a Bedouin community, where a group of Palestinian families settled around 20 people, all belonging to the Harashina family. According to Ahmed, they have lived in this location for 47 years - they settled in this area because it was a good place for agricultural lands and find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the occupied West Bank also face an extremely difficult reality and are under the standing.</p>
              </div>
            </div>
          )}
        </div>

        {/* Settlements scene */}
        <div data-scene-id="settlements" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Settlements</h1>
              <div className="hero-body">
                <p>The word "village" may be an overstatement. Farj'a Nabaa al-Ghazzal is a Bedouin community, where a group of Palestinian families settled around 20 people, all belonging to the Harashina family. According to Ahmed, they have lived in this location for 47 years - they settled in this area because it was a good place for agricultural lands and find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the occupied West Bank also face an extremely difficult reality and are under the standing.</p>
              </div>
            </div>
          )}
        </div>
        {/* Pogrom scene */}
        <div data-scene-id="pogrom" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Pogrom</h1>
              <div className="hero-body">
                <p>The word "village" may be an overstatement. Farj'a Nabaa al-Ghazzal is a Bedouin community, where a group of Palestinian families settled around 20 people, all belonging to the Harashina family. According to Ahmed, they have lived in this location for 47 years - they settled in this area because it was a good place for agricultural lands and find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the occupied West Bank also face an extremely difficult reality and are under the standing.</p>
              </div>
            </div>
          )}
        </div>
        {/* Way to Mehola Fields scene */}
        <div data-scene-id="mehola-fields" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Way to Mehola Fields</h1>
              <div className="hero-body">
                <p>The word "village" may be an overstatement. Farj'a Nabaa al-Ghazzal is a Bedouin community, where a group of Palestinian families settled around 20 people, all belonging to the Harashina family. According to Ahmed, they have lived in this location for 47 years - they settled in this area because it was a good place for agricultural lands and find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the occupied West Bank also face an extremely difficult reality and are under the standing.</p>
              </div>
            </div>
          )}
        </div>
        {/* Shdemot Mehola scene */}
        <div data-scene-id="shdemot-mehola" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shdemot Mehola</h1>
            <div className="hero-body">
                <p>The word "village" may be an overstatement. Farj'a Nabaa al-Ghazzal is a Bedouin community, where a group of Palestinian families settled around 20 people, all belonging to the Harashina family. According to Ahmed, they have lived in this location for 47 years - they settled in this area because it was a good place for agricultural lands and find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the occupied West Bank also face an extremely difficult reality and are under the standing.</p>
              </div>
            </div>
          )}
        </div>

        {/* Noam's Office scene */}
        <div data-scene-id="noam-office" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Noam's Office</h1>
            <div className="hero-body">
                <p>The word "village" may be an overstatement. Farj'a Nabaa al-Ghazzal is a Bedouin community, where a group of Palestinian families settled around 20 people, all belonging to the Harashina family. According to Ahmed, they have lived in this location for 47 years - they settled in this area because it was a good place for agricultural lands and find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the occupied West Bank also face an extremely difficult reality and are under the standing.</p>
              </div>
            </div>
          )}
        </div>
        {/* Mehola Spawl Scene */}
        <div data-scene-id="mehola-spawl" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Mehola Spawl</h1>
            <div className="hero-body">
                <p>The word "village" may be an overstatement. Farj'a Nabaa al-Ghazzal is a Bedouin community, where a group of Palestinian families settled around 20 people, all belonging to the Harashina family. According to Ahmed, they have lived in this location for 47 years - they settled in this area because it was a good place for agricultural lands and find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the occupied West Bank also face an extremely difficult reality and are under the standing.</p>
              </div>
            </div>
          )}
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
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

// Removed unused StorySite route and component placeholder
