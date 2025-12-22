import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import MapCanvas from './components/MapCanvas.jsx'
import { useEffect, useState, useRef } from 'react'
import farsiaSteps from './data/scenes/scenes.json'
import { bindScrollScenes } from './map/sceneController.js'
// removed unused imports for Story route and site registries

// Configure which site IDs (see data/sites.js) should be visible per scene.
// Each entry can reset the current dots, add new ones, or remove some while leaving others.
const sceneDotScript = {
  intro: { reset: true, show: ['farsia', 'naama', 'nueima', 'shdemot-mehola'], hide: ['naama-solar-fields', 'nueima-solar-fields', 'rotem'] },
  'farsia-village': { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: ['farsia'] },
  'farsia-video': { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: [] },
  settlements: { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: [] },
}

function Layout({ children }) {
  return <div className="app">{children}</div>
}

function Home() { 
  const [mapInstance, setMapInstance] = useState(null)
  const [currentScene, setCurrentScene] = useState('intro')
  const [storyStarted, setStoryStarted] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)
  const [visibleSiteIds, setVisibleSiteIds] = useState([])
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

  useEffect(() => {
    const script = sceneDotScript[currentScene]
    if (!script) return
    setVisibleSiteIds((prev) => {
      let next = script.reset ? [] : [...prev]
      if (script.hide?.length) {
        next = next.filter((id) => !script.hide.includes(id))
      }
      if (script.show?.length) {
        for (const id of script.show) {
          if (!next.includes(id)) {
            next.push(id)
          }
        }
      }
      return next
    })
  }, [currentScene])
  
  // No-op: overlay doesn't need artificial height; scenes equal 100vh sections
  
  return (
    <div className="landing" ref={landingRef}>
      <header className="landing-header">
        <div className="logo">
          <img src="/assets/Camel.png" alt="Camel logo" />
        </div>
        <nav className="landing-nav">
          <Link target="_blank" to="https://caravancollective.org/"><span style={{fontFamily: 'El Messiri'}}>Caravan</span> <span style={{fontFamily: 'Suisse Intl'}}>Collective</span></Link>
          <button style={{fontFamily: 'Suisse Intl'}} onClick={handleStartClick} className="start-button">Start</button>
        </nav>
      </header>
      <div className="landing-map">
        <MapCanvas 
          onReady={setMapInstance} 
          //showVideoPoints={currentScene === 'farsia-village'} 
          grayscale={currentScene === 'intro'}
          onDotClick={handleDotClick}
          scrollContainer={landingRef.current}
          visibleSiteIds={visibleSiteIds}
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
                <p>Farsiya is located in Area C of the West Bank, under direct Israeli military and civil control. This means that, by law, Israel has an obligation to provide basic services to the Area's population, including electricity and water supplies. However, while the Occupation has indeed installed both water pipes and an electricity line just a few dozen meters away from Al Farsiya, it exists exclusively to serve the illegal settlements. The Occupation authorities, going against International Law regulating Military Occupation (TK LINK), have not connected the hamlet to the grid, leaving it to its own, scarce devices to build such basic services. For many Palestinian communities in Area C, which constitutes over 60 per cent of the West Bank, power generated through solar energy is the only source of available electricity.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Al-Farsia Video scene */}
        <div data-scene-id="farsia-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Life in Al-Farsia</h1>
              <div className="hero-body">
                <div className="hero-body-video" >
                  Video Placeholder - Ahmad's Interview
                </div>
                <p>They own a few hundred sheep, and a small patch of agricultural land, where they grow barley to feed the sheep. This is the economic backbone of the tiny community, they sell the lamb and sheep cheese, buy everything else they need from the markets. Both agriculture and grazing have become increasingly difficult because of pressure from Israeli settlers living nearby, who have cut Farsiya off its grazing land, and frequently damage the agricultural fields by grazing their own sheep flocks there.</p>
              </div>
            </div>
          )}
        </div>
        
         {/* Al-Farsia village scene 2*/}
         <div data-scene-id="farsia-village-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Al - Farsia Story</h1>
              <div className="hero-body">
                <p>
                The word “village” may be an overstatement. Farsiya Naba’a al-Ghazzal is a hamlet in the Israeli-occupied Jordan Valley. Farsiya is home to around 20 people, all belonging to the Daraghme family. According to Ahmad, they have lived in this location for 47 years. Palestinian shepherding communities used to move around a lot, sometimes to find better pastures, sometimes as a consequence of forced displacement by Israeli settlers and the army. Most of these communities in the Jordan Valley have been expelled already. Farsiya is one of the last ones still standing.
                </p>
              </div>
            </div>
          )}
        </div>

        {/*Rotem scene*/}
        <div data-scene-id="rotem" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Rotem</h1>
              <div className="hero-body">
                <p>Rotem is a settlement in the Jordan Valley, built in 1983. It is home to around 1000 people, most of whom are Jewish. The settlement is home to a number of Israeli military bases, and is a major center of Israeli military activity in the Jordan Valley.</p>
              </div>
            </div>
          )}
        </div>

         {/* In the Community Video scene */}
         <div data-scene-id="in-the-community-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">In the Community Video</h1>
              <div className="hero-body">
                <div className="hero-body-video" >
                  Video Placeholder - In the Community Video
                </div>
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
                <p>“There's the settlers, there’s the army”, says Ahmad, “Every other day they come to attack us.” Ahmad is 32 years old, and serves as the informal leader of the community. On September 9th 2023, a month before October 7th, Ahmad was grazing his sheep on his traditional grazing lands near his summer camp. He was accompanied by two members of the human rights advocacy organisation Jordan Valley Activists (JVA), who regularly come with Ahmad to ensure his safety. This day it didn’t help. Nine masked settlers descended upon them, and attacked Ahmad and the activists. They broke Ahmad’s hand with an iron bar, leaving him in a cast for weeks. Israeli police refused to investigate the crime.
                </p>
                <p>Across the road from it is the Israeli settlement Rotem built in 1983. Rotem prides itself on being a “green” settlement, using recycling and environment-friendly construction. Adjacent to Rotem is an outpost managed by Didi Amosi and his family, called Tene Yarok farm. The outpost terrorises the village of Farsiya on a daily basis, regularly invading the village, assaulting residents and destroying property. A bit further away sits the settlement Shadmot Mehola, another centre of settler terror in the area. Its residents also have a history of attacking Palestinian residents and activists, and destroying property. This settlement also houses the Shadmot Mehola solar panel field.
                </p>
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
                <p>On April 14, 2024, a group of masked settlers left the settlement of Mehola shortly after midnight. Moving on foot, they passed near the outpost of Rotem and crossed Highway 578, the main north–south road in the Jordan Valley. From there they continued toward the Palestinian village of Farsiya.</p>
                <p>Most residents were asleep when the settlers entered the community. Witnesses said the group split into smaller clusters, some approaching houses while others went toward the area where solar panels were kept. During the incursion, the settlers forced their way into the community, attacked residents, set fire to a car and destroyed nearly all of the solar panels that supply electricity to the village.</p>
                <p>The attack lasted more than an hour before the settlers withdrew in the direction they had come. No arrests were made, and the Israeli police later confirmed they would not open an investigation.</p>
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
                <p>The settlement was established in 1979 as part of a broader effort to create Israeli military infrastructure along the Jordanian border. Today, Shadmot Mehola is a civilian religious community, comprising approximately 650 residents, including farmers, teachers, lawyers, and other professionals. </p>
                <p>Four soldiers man the large electric gate leading into the settlement. Their wary expressions fade once they hear us speak Hebrew. Inside the gate, the desert topography of the Jordan Valley becomes unrecognizable: flourishing - albeit foreign - trees line the sidewalks, green grass surrounds neat, tiled-roofed houses, and even the dusty air seems clearer beyond the electric fence.</p>
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
                <p>While Palestinian communities are struggling to survive with basic energy supplies, international companies profit from powering Israeli settlements. One of these settlements, Shadmot Mehola, is just a 10-minute ride north of Farsiya. </p>
                <p>As we drive up the paved road, in contrast to the dirt road leading up to Farsiya, it is impossible to miss the half-kilometre stretch of gleaming solar panels. These panels are directly connected to the Israel Electric Corporation (IEC), the national electricity company, as explained by Noam Bigon, administrator of the settlement. </p>
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
                <p>The settlement was established in 1979 as part of a broader effort to create Israeli military infrastructure along the Jordanian border. Today, Shadmot Mehola is a civilian religious community, comprising approximately 650 residents, including farmers, teachers, lawyers, and other professionals. </p>
                <p>Four soldiers man the large electric gate leading into the settlement. Their wary expressions fade once they hear us speak Hebrew. Inside the gate, the desert topography of the Jordan Valley becomes unrecognizable: flourishing - albeit foreign - trees line the sidewalks, green grass surrounds neat, tiled-roofed houses, and even the dusty air seems clearer beyond the electric fence.</p>
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
                <p>Noam welcomes us with tea and coffee in his air-conditioned office, offering seats in front of a large map of the settlement. He points out the communal buildings: synagogues, community center, school, swimming pool, and territory allocated for 120 pre-fabricated residential units. These single-family homes can be assembled in just two weeks, he says proudly: “Families from all over the country want to live here… there’s a calm environment.”</p>
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
                <p>Tracing his finger down to the road we arrived from, Noam indicates the Shadmot Mehola Solar Field. Built in 2016, it spans over 50,000 square meters with a capacity of 5 MW, an investment of 40 million shekels.</p>
                <p>In 1997, this land was taken from the Palestinian Tubas governorate, and transferred to the settlement by the World Zionist Organisation. In 2023 the Civil Administration outlines a new “solar gate” that will encircle the entire settlement. “We are doing an innovative project,” Noam explains. “The settlement gate itself will be made of solar panels. It will produce its own security lighting. Come back in two years and you will see.”</p>
                <p>The Shadmot Mehola Solar Field was approved under a special arrangement by the Ministry of Energy and the Electricity Authority for entrepreneurs operating in the occupied West Bank. As part of this scheme, the state guaranteed that it would purchase electricity from the field at a relatively high price of 0.54–0.51 shekels per kWh for at least 20 years.</p>
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
