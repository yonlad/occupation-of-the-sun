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
  'farsia-village': { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: ['farsia', 'shdemot-mehola-solar'] },
  'farsia-video': { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: [] },
  'rotem': {show: ['rotem']},
  settlements: { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: [] },
  'sub-intro-2': { hide: ['naama-solar-fields', 'nueima-solar-fields', 'rotem', 'shdemot-mehola-solar'], show: [] },
  'naama-nueima': { hide: [], show: ['naama-solar-fields', 'nueima-solar-fields'] },
  'nueima-zoom': { show: ['nueima', 'beit-al-ajdad', 'jericho-governate'] },
  'west-bank': { hide: ['naama-solar-fields', 'nueima-solar-fields', 'jericho-governate', 'beit-al-ajdad'] },
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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const landingRef = useRef(null)
  const suppressIntroHeroOnceRef = useRef(false)
  const farsiaVideoRef = useRef(null)
  
  const handleStartClick = () => {
    suppressIntroHeroOnceRef.current = true
    setHeroVisible(false)
    setStoryStarted(true)
    document.querySelector('[data-scene-id="farsia-village"]')?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleChapterClick = (sceneId) => {
    if (sceneId === 'intro') {
      // For intro, show the hero card
      setHeroVisible(true)
    } else {
      // For other scenes, hide hero and start story
      suppressIntroHeroOnceRef.current = true
      setHeroVisible(false)
      setStoryStarted(true)
    }
    document.querySelector(`[data-scene-id="${sceneId}"]`)?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleDotClick = () => {
    setHeroVisible(false)
  }
  
  useEffect(() => {
    if (!mapInstance?.map) return
    const unbind = bindScrollScenes(mapInstance.map, farsiaSteps, (sceneId) => {
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
  
  // Toggle West Bank overlay visibility based on current scene
  useEffect(() => {
    if (!mapInstance?.showWestBankOverlay) return
    // Show overlay only on sub-intro scene
    const shouldShow = currentScene === 'sub-intro' || currentScene === 'west-bank'
    mapInstance.showWestBankOverlay(shouldShow)
  }, [currentScene, mapInstance])
  
  // Debug logging
  useEffect(() => {
    console.log('🔄 State update - storyStarted:', storyStarted, 'currentScene:', currentScene)
  }, [storyStarted, currentScene])
  
  // Pause video when leaving the video scene
  useEffect(() => {
    if (currentScene !== 'farsia-video' && farsiaVideoRef.current) {
      farsiaVideoRef.current.pause()
      setIsVideoPlaying(false)
    }
  }, [currentScene])
  
  const handleVideoPlayClick = () => {
    if (farsiaVideoRef.current) {
      farsiaVideoRef.current.play()
      setIsVideoPlaying(true)
    }
  }
  
  const handleVideoPlay = () => setIsVideoPlaying(true)
  const handleVideoPause = () => setIsVideoPlaying(false)

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
          <img src={`${import.meta.env.BASE_URL}assets/Camel.png`} alt="Camel logo" />
        </div>
        <div className="chapter-nav">
          <button style={{fontFamily: 'Suisse Intl'}} onClick={() => handleChapterClick('intro')} className="start-button">Start</button>
          <button style={{fontFamily: 'Suisse Intl'}} onClick={() => handleChapterClick('farsia-village')} className="start-button">Al-Farsia</button>
          <button style={{fontFamily: 'Suisse Intl'}} onClick={() => handleChapterClick('naama-nueima')} className="start-button">Nu'eima</button>
          <button style={{fontFamily: 'Suisse Intl'}} onClick={() => handleChapterClick('west-bank')} className="start-button">Energy Apartheid</button>
          <button style={{fontFamily: 'Suisse Intl'}} onClick={() => handleChapterClick('globe-scene')} className="start-button">Global Complicity</button>
        </div>
        <nav className="landing-nav">
          <Link target="_blank" to="https://caravancollective.org/"><span style={{fontFamily: 'El Messiri'}}>Caravan</span> <span style={{fontFamily: 'Suisse Intl'}}>Collective</span></Link>
          
        </nav>
      </header>
      <div className="landing-map">
        <MapCanvas 
          onReady={setMapInstance} 
          //showVideoPoints={currentScene === 'farsia-village'} 
          grayscale={currentScene === 'intro' || currentScene === 'intro-2' || currentScene === 'globe-scene'}
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

        {/* Sub Intro scene */}
        <div data-scene-id="sub-intro" className="scroll-section">
          
        </div>
        
        {/* Al-Farsia village scene */}
        <div data-scene-id="farsia-village" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Al - Farsia</h1>
              <div className="hero-body">
                <p>Barely a couple of kilometres apart, the Palestinian village of Al Farsiya Naba’a Al-Ghazzal and the Israeli settlement of Shadmot Mehola face two starkly different everyday realities.
                </p>
                <p>By examining the disparity in access to solar energy use and production, The Occupation of the Sun narrates how Palestinians' efforts for energy self-reliance are suppressed by industrial projects supporting Israeli settlements, funded by international stakeholders. This project reveals only a part of the complex and deeply rooted systems of oppression and apartheid that characterise Israel's occupation of Palestine.</p>
                <p>The destruction of these Palestinian communities’ livelihoods occurs through economic, infrastructural, and outwardly violent actions by settlers and military forces. Yet, the indigenous resilience remains unbroken, as Palestinians refuse to abandon their lands.</p>
              </div>
            </div>
          )}
        </div>

        {/* Al-Farsia village scene 2*/}
        <div data-scene-id="farsia-village-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Al - Farsia</h1>
              <div className="hero-body">
              <p>In the northern edge of the Jordan Valley, is the village of Al-Farsiya Naba’a Al-Ghazzal.</p>
              <p>For 47 years, the tiny hamlet, home to roughly 20 members of the Daraghme family, has survived in the Israeli-occupied West Bank. </p>
              <p>All of its electricity comes from a handful of solar panels. The community once had a generator, but it was destroyed during one of several settler attacks in April 2024.</p>
              <p>Al-Farsiya is one of the last remaining Palestinian shepherding communities in the Jordan Valley. Most others have already been displaced. The Daraghme family counts a few hundred sheep and a small strip of barley fields, an economy steadily strangled by nearby settlers who block access to grazing land and routinely damage crops by running their own flocks through the fields. Tubas, the closest Palestinian town, used to be a half-hour drive away; now, with the Israeli military’s closure of the Al-Hamra checkpoint for nearly two years, every trip requires a multi-hour detour.</p>
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
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Naama-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
         {/* Al-Farsia village scene 2*/}
         <div data-scene-id="rotem" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Al - Farsia</h1>
              <div className="hero-body">
                <p>
                  Across Area C, which makes up more than 60 per cent of the West Bank and is under full Israeli military control, solar power is often the only available source of electricity for Palestinian herding communities -- like Al-Farsiya. Israel has refused to connect these communities to the grid, despite its obligation under international humanitarian law to provide basic services to the population under occupation. 
                </p>
                <p>
                  Al-Farsiya’s solar panels were installed by Comet-ME, an Israeli-Palestinian NGO that provides basic water and energy infrastructure to vulnerable villages. But these installations are frequent targets. 
                </p>
                <p>
                “There's the settlers, and there’s the army,” said 32-year-old Ahmad Daraghme, the hamlet’s informal leader. “Every other day they come to attack us.” In September 2023, nine masked settlers from Rotem settlement assaulted him on his traditional grazing lands, breaking his hand with an iron bar, leaving him in a cast for weeks; Israeli police declined to investigate. 
                </p>
                <p>
                  The violence escalated in April 2024, when dozens of settlers stormed Al-Farsiya at night, attacking residents, burning a car and smashing nearly every solar panel. Police again refused to open a case. 
                </p>
                <p>Today, the shattered panels serve as makeshift fencing around the homes.</p>
              </div>
            </div>
          )}
        </div>

        {/* Rotem Video scene */}
        <div data-scene-id="rotem-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Al-Farsia Energy</h1>
              <div className="hero-body">
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Naama-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/*settlements scene*/}
        <div data-scene-id="settlements" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1>
              <div className="hero-body">
                <p>Israel has set ambitious targets to expand its solar energy capacity by 2030. The government aims to generate 30% of the nation's electricity from renewable sources by that year, with solar energy playing a central role. To achieve this goal, Israel plans to increase its installed solar capacity to approximately 17 gigawatts (GW) by 2030. This expansion will involve the development of large-scale solar farms, integration of energy storage solutions, and the promotion of rooftop solar installations across the country. 
                </p>
                <p>
                  The irony is impossible to miss: just a few dozen meters away, Israel has laid water pipes and an electricity line, but only to serve the nearby settlements. While Israel promotes its green energy initiatives and environmental policies, it systematically exploits Palestinian land, water, and natural resources.</p>
              </div>
            </div>
          )}
        </div>

        {/*shdemot mehola scene*/}
        <div data-scene-id="shdemot-mehola" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1>
              <div className="hero-body">
                <p>The rapid expansion of solar energy in the occupied West Bank has become a tool of colonisation, land seizure, and resource extraction, packaged as “green development.” This greenwashing masks the systematic transfer of  Palestinian land and resources to Israeli and international corporations through lucrative renewable energy investments. 
                </p>
                <p>
              Settlements are increasingly powered by large, internationally funded solar farms, while Palestinian communities in the same areas struggle simply to keep the lights on. Small, improvised systems are routinely demolished or vandalised by settlers or the military.  The result is two starkly different energy realities in one territory — what some call “Energy apartheid”.
                </p>
              </div>
            </div>
          )}
        </div>

        {/*shdemot mehola zoom scene*/}
        <div data-scene-id="shdemot-mehola-zoom" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1> 
            <div className="hero-body">
            <p>Just a 10-minute drive from Al-Farsiya, set in a parallel, luxurious, dystopian reality, is the settlement of Shadmot Mehola. 
              While Al-Farsiya struggles to keep a few fragile solar panels standing, international companies are profiting from the Israeli settlements around it. </p>
              <p>Founded in 1979 as part of a broader effort to create Israeli military infrastructure along the Jordanian border, Shadmot Mehola became a civilian settlement in 1984 and is now home to roughly 650 residents — farmers, teachers, lawyers and other professionals. Four soldiers guard the settlement’s large electric gate. Beyond the fence, the Jordan Valley’s desert topography seems to disappear: flourishing - albeit foreign - trees line the sidewalks, manicured lawns surround neat, tiled-roofed houses, and even the air seems clearer inside the enclosure.
              </p>
              </div>
            </div>
          )}
        </div>

        {/*shdemot mehola zoom scene 2*/}
        <div data-scene-id="shdemot-mehola-zoom-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1> 
            <div className="hero-body">
            <p>Noam Bigon, the settlement’s administrator, welcomed us into his air-conditioned office, offering tea and coffee in front of a large map of the settlement. He traced the locations of synagogues, community centers, schools, swimming pools, and a wide zoned area for 120 prefabricated housing units — single-family homes that, he said proudly, could be assembled in just two weeks. “Families from all over the country want to live here,” he said. “There’s a calm environment.”
              </p>
              </div>
            </div>
          )}
        </div>

         {/* Shdemot Mehola Video scene */}
         <div data-scene-id="shdemot-mehola-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1>
              <div className="hero-body">
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Shdemot-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/*shdemot mehola out scene*/}
        <div data-scene-id="shdemot-mehola-out" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Solar Field</h1>
              <div className="hero-body">
              <p>The dirt track leading out of Al-Farsiya gives way to a smooth, paved route that rises toward a half-kilometer stretch of gleaming solar panels. These panels, Bigon explained, are connected directly to the Israel Electric Corporation (IEC), the national grid. 
              </p>
              <p>Sliding his finger toward the road we had driven on, Bigon pointed to the Shadmot Mehola Solar Field. Built in 2016, the installation covered more than 50,000 square meters and produced five megawatts of electricity, financed by a 40-million-shekel private Israeli investment. The land beneath the solar field had been taken in 1997 from the Palestinian Tubas governorate and transferred to the settlement through the World Zionist Organisation.
              </p>
              </div>
            </div>
          )}
        </div>

        {/*shdemot mehola solar field scene*/}
        <div data-scene-id="shdemot-mehola-solar-field" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Solar Field</h1>
              <div className="hero-body">
              <p>A newer project was also underway. In 2023, the Civil Administration outlined plans for a “solar gate” that would encircle the entire settlement. “We are doing an innovative project,” Bigon explained. “The settlement's gate itself will be made out of solar panels. It will produce its own security lighting. Come back in two years, and you will see.”
              </p>

              <p>The solar field operated under a special arrangement approved by the Ministry of Energy and the Electricity Authority for entrepreneurs in the occupied West Bank. Through this scheme, the Israeli state guaranteed it would buy electricity from the field for at least 20 years at an unusually high rate of NIS 0.51–0.54 (.16 -.17 USD) per kilowatt.
              </p>
              <p>When asked if the residents of Shadmot Mehola cared about the environmental significance of the panels, Bigon emphasized that, above all, they were a source of profit for the community. “On the panels, you can draw a dollar sign,” he said. “That is their significance.”
              </p>
              </div>
            </div>
          )}
        </div>
        {/* Shdemot Mehola Video scene */}
        <div data-scene-id="shdemot-mehola-solar-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Shadmot Mehola Solar Field</h1>
              <div className="hero-body">
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Shdemot-solar-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>


        {/*settlements-2 scene*/}
        <div data-scene-id="settlements-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola & Al-Farsiya</h1>
              <div className="hero-body">
              <p>The relationship between Shadmot Mehola and Al-Farsiya runs far deeper than energy disparity and land seizure. According to evidence collected by the human rights group Jordan Valley Activists (JVA), settlers from Shadmot Mehola have for years been involved in violent attacks targeting Al-Farsiya.
              </p>
              <p>
              In September 2023, the settlers who broke Ahmad’s hand with an iron bar came from Shadmot Mehola. Among them were the Rosenberg brothers — the grandsons of the rabbi who founded the settlement’s religious school. The settlement’s security coordinator watched the attack without intervening.
              </p>
              <p>
              On June 9, 2025 two settlers walked down from Shadmot Mehola to begin constructing a 150-meter fence just two meters away from Al-Farsiya’s homes, cutting off the village from its remaining land.
              </p>
              </div>
            </div>
          )}
        </div>

        {/*sub-intro-2 scene*/}
        <div data-scene-id="sub-intro-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola & Al-Farsiya</h1>
              <div className="hero-body">
              <p>The brutal violence inflicted on Ahmad and his family is not separate from the settlement’s glossy green energy projects. They are two sides of the same effort: a system designed to remove Palestinian communities from the Jordan Valley and replace them with Israeli settlers. The men who engineered the solar panels and the men who attacked Ahmad live in the same houses, and work towards the same end. 
              </p>
              </div>
            </div>
          )}
        </div>
         {/*naama-nueima scene*/}
         <div data-scene-id="naama-nueima" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
              <p>The Israeli settlement of Na'ama was established in 1982 in the Jordan Valley, occupied West Bank.Na'ama was established on land confiscated from the Palestinian village of An Nuwei’ma. According to ARIJ’s GIS Unit (2011), the Israeli government seized 5,048 dunums — roughly 10.4% of the village’s total area — to build what was then called “Na’omi.” 
              </p>
              </div>
            </div>
          )}
        </div>
        {/*naama scene*/}
        <div data-scene-id="naama" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
              <p>As of 2022, Na’amas’ population stood at 247 residents, following a communal secular lifestyle. For several years, the settlement was formally renamed Na'omi before the original name, Na'ama, was reinstated. </p>
            <p>
            The name Na'ama is an acronym for Hebrew Youth Settling the West Bank. The residents of Na’ama are mainly engaged in agriculture, growing dates, green herbs, orchards, and vegetables. The agriculture production exports goods both locally and internationally.
            
              </p>
              </div>
            </div>
          )}
        </div>
        {/*naama scene*/}
        <div data-scene-id="naama-zoom" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
              
              </div>
            </div>
          )}
        </div>
        {/* Na'ama Video scene */}
        <div data-scene-id="naama-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Na'ama Video</h1>
              <div className="hero-body">
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Shdemot-solar-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/*naama-2 scene*/}
        <div data-scene-id="naama-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
              
              </div>
            </div>
          )}
        </div>
        {/* Na'ama solar Video scene */}
        <div data-scene-id="naama-solar" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Na'ama Solar</h1>
              <div className="hero-body">
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Shdemot-solar-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/*naama-nueima scene*/}
        <div data-scene-id="naama-nueima-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
              </div>
            </div>
          )}
        </div>
        {/*nueima zoom scene*/}
        <div data-scene-id="nueima-zoom" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Nu'eima</h1>
              <div className="hero-body">
              </div>
            </div>
          )}
        </div>
        {/*nueima solar scene*/}
        <div data-scene-id="nueima-solar" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Nu'eima Solar</h1>
              <div className="hero-body">
              </div>
            </div>
          )}
        </div>
        {/* Nu'eima Solar Video scene */}
        <div data-scene-id="nueima-solar-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Nu'eima Solar</h1>
              <div className="hero-body">
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Shdemot-solar-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/*nueima zoom 2 scene*/}
        <div data-scene-id="nueima-zoom-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Nu'eima</h1>
              <div className="hero-body">
              </div>
            </div>
          )}
        </div>
        {/*beit al ajdad scene*/}
        <div data-scene-id="beit-al-ajdad" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Beit Al-Ajdad Elderly Care Home</h1>
              <div className="hero-body">
              </div>
            </div>
          )}
        </div>
        {/* Beit Al-Ajdad Video scene */}
        <div data-scene-id="beit-al-ajdad-video" className="scroll-section">
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Beit Al-Ajdad Elderly Care Home</h1>
              <div className="hero-body">
                <div className="video-container">
                  <video 
                    ref={farsiaVideoRef}
                    className="scene-video"
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                  >
                    <source src={`${import.meta.env.BASE_URL}assets/videos/Shdemot-solar-video.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!isVideoPlaying && (
                    <button 
                      className="video-play-button"
                      onClick={handleVideoPlayClick}
                      aria-label="Play video"
                    >
                      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/*west-bank scene*/}
        <div data-scene-id="west-bank" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Back Again</h1>
              <div className="hero-body">
              </div>
              <p>
              The need for sustainable energy systems is undeniable. But Israel’s self-portrait as a sustainable state also serves a political purpose, obscuring the extent to which its renewable-energy simultaneously fuels and relies on the seizure of Palestinian land. 
              </p>
              <p>
              The structural imbalance stretches back decades. Since 1992, following the Oslo Accords, Palestinian areas A and B have been forced to purchase all electricity from the Israel Electric Corporation. The IEC, for its part, sources power from industrial zones in settlements across the West Bank and in the Naqab/Negev — areas, where dozens of Palestinian villages and Bedouin communities have been displaced to make way for solar fields and related infrastructure. 
            </p>

            </div>
          )}
        </div>
        {/*west-bank scene*/}
        <div data-scene-id="west-bank" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Back Again</h1>
              <div className="hero-body">
              </div>
              <p>
              Israel has invested heavily in branding itself as a green pioneer since the early 2010s. In a 2015 speech to the United Nations, Israel’s ambassador boasted that the country had become “a hub for renewable energy research and development.” 
              </p>
              <p>
              “The same sun that shines equally on all of us, is owned by none of us, and can supply energy in abundance, inherently promotes peace,” he continued.
              </p>
              <p>
              But this self-branding became much more aggressive after 2020, when Israel announced its 2030 renewable energy targets.
              </p>

            </div>
          )}
        </div>
        {/*west-bank scene*/}
        <div data-scene-id="west-bank" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Back Again</h1>
              <div className="hero-body">
              </div>
              <p>
              Israel’s solar electricity generation grew from virtually nothing in 2008 to 7,540 gigawatts by 2023 — making up 86% of its renewable output.
              </p>
              <p>
              This rapid buildup hasn’t happened in a vacuum. It has been driven by an aggressive set of economic incentives designed to facilitate private investment into the solar market. Subsidies, long-term feed-in tariffs, guaranteed grid access, and streamlined permitting have turned renewable energy into a highly profitable venture.
              </p>
              <p>
              As reported by Who Profits in 2024, “between 2017 and 2022, the Israel Land Authority profited over 184.5 million NIS from solar field projects, approving 68 new transactions with a total capacity of 750 megawatts.”
              </p>

            </div>
          )}
        </div>
        {/*west-bank scene*/}
        <div data-scene-id="west-bank" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Back Again</h1>
              <div className="hero-body">
              </div>
              <p>
              Contrary to the ambassador’s words, in the occupied West Bank, the sun does not shine equally on all. 
              </p>
              <p>
              International corporations are deeply embedded in the solar infrastructure that underpins Israel’s occupation. Across Area C of the West Bank and Naqab/Negev, dozens of foreign companies manufacture, sell, and maintain solar systems that power settlements and industrial zones — either directly or through joint partnerships with Israeli firms. The most commercially entangled countries are the United States, Germany, China, France, and Italy. 
              </p>

            </div>
          )}
        </div>
        {/*globe scene*/}
        <div data-scene-id="globe-scene" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Globe</h1>
              <div className="hero-body">
              </div>

            </div>
          )}
        </div>
        {/*globe scene*/}
        <div data-scene-id="globe-scene" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Globe</h1>
              <div className="hero-body">
              </div>

            </div>
          )}
        </div>
        {/*globe scene*/}
        <div data-scene-id="globe-scene" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Globe</h1>
              <div className="hero-body">
              </div>

            </div>
          )}
        </div>
        {/*globe scene*/}
        <div data-scene-id="globe-scene" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Globe</h1>
              <div className="hero-body">
              </div>

            </div>
          )}
        </div>
        {/*globe scene*/}
        <div data-scene-id="globe-scene" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Globe</h1>
              <div className="hero-body">
              </div>

            </div>
          )}
        </div>
        {/*intro-2 scene*/}
        <div data-scene-id="intro-2" className="scroll-section">
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Introduction</h1>
              <div className="hero-body">
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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
