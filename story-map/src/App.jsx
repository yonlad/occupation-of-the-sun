import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import MapCanvas from './components/MapCanvas.jsx'
import { useEffect, useState, useRef } from 'react'
import farsiaSteps from './data/scenes/scenes.json'
import farsiaStepsMobile from './data/scenes/scenes-mobile.json'
import { bindScrollScenes } from './map/sceneController.js'
// removed unused imports for Story route and site registries

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

// Helper component to render scene sections for mobile/desktop
function SceneSection({ sceneId, isMobile, children, showHero = true, combineOnMobile = false }) {
  if (isMobile) {
    // Check if this is a video scene by sceneId
    const isVideoScene = sceneId && sceneId.includes('video')
    
    // For video scenes on mobile: hide hero card wrapper, show video in scene section
    if (isVideoScene) {
      return (
        <div data-scene-id={sceneId} className="scroll-section mobile-scene-section mobile-video-section">
          {showHero && children}
        </div>
      )
    }
    
    // If combineOnMobile is true, render hero card and scene section together (like desktop)
    // This is useful for scenes like sub-intro where the map legend should show alongside the map
    if (combineOnMobile) {
      return (
        <div data-scene-id={sceneId} className="scroll-section mobile-scene-section mobile-combined-section">
          {showHero && children}
        </div>
      )
    }
    
    // On mobile: render hero card section and scene section separately
    return (
      <>
        {showHero && children && (
          <div className="scroll-section mobile-hero-section">
            {children}
          </div>
        )}
        <div data-scene-id={sceneId} className="scroll-section mobile-scene-section"></div>
      </>
    )
  } else {
    // On desktop: render hero card overlaid on scene section
    return (
      <div data-scene-id={sceneId} className="scroll-section">
        {children}
      </div>
    )
  }
}

// Configure which site IDs (see data/sites.js) should be visible per scene.
// Each entry can reset the current dots, add new ones, or remove some while leaving others.
const sceneDotScript = {
  intro: { reset: true, show: ['farsia', 'naama', 'nueima', 'shdemot-mehola'], hide: ['naama-solar-fields', 'nueima-solar-fields', 'rotem'] },
  'farsia-village': { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: ['farsia', 'shdemot-mehola-solar'] },
  'farsia-video': { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: [] },
  settlements: { hide: ['naama-solar-fields', 'nueima-solar-fields'], show: [] },
  'sub-intro-2': { hide: ['naama-solar-fields', 'nueima-solar-fields', 'rotem', 'shdemot-mehola-solar'], show: [] },
  'naama-nueima': { hide: [], show: ['naama-solar-fields', 'nueima-solar-fields'] },
  'nueima-zoom': { show: ['nueima', 'beit-al-ajdad', 'jericho-governate'] },
  'west-bank': { show: ['farsia, naama, nueima, shdemot-mehola'], hide: ['naama-solar-fields', 'nueima-solar-fields', 'jericho-governate', 'beit-al-ajdad'] },
  'globe-scene': { hide: ['farsia', 'naama', 'nueima', 'shdemot-mehola']},
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
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const landingRef = useRef(null)
  const suppressIntroHeroOnceRef = useRef(false)
  const farsiaVideoRef = useRef(null)
  const isMobile = useIsMobile()
  
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
    }, { 
      root: landingRef.current || null,
      mobileSteps: farsiaStepsMobile,
      isMobile: isMobile
    })
    return () => unbind?.()
  }, [mapInstance, storyStarted, isMobile])
  
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
  
  // Hide scroll indicator when user scrolls past the intro section
  useEffect(() => {
    const container = landingRef.current
    if (!container) return
    
    const handleScroll = () => {
      const scrollTop = container.scrollTop
      // Hide indicator after scrolling 100px (adjustable threshold)
      if (scrollTop > 100) {
        setShowScrollIndicator(false)
      } else if (scrollTop <= 10) {
        // Show indicator again when back at top
        setShowScrollIndicator(true)
      }
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Pause video when leaving the video scene
  useEffect(() => {
    if (currentScene !== 'farsia-video' && farsiaVideoRef.current) {
      farsiaVideoRef.current.pause()
      setIsVideoPlaying(false)
    }
  }, [currentScene])
  
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

  // Loop functionality: when user scrolls to the loop-trigger scene, scroll back to start
  // We detect this via the sceneController's scene change callback
  useEffect(() => {
    if (currentScene === 'loop-trigger' && storyStarted) {
      console.log('🔄 Loop triggered! Scrolling back to start...')
      // Small delay to let the scroll finish, then loop back
      const timeoutId = setTimeout(() => {
        document.querySelector('[data-scene-id="intro"]')?.scrollIntoView({ behavior: 'smooth' })
        setHeroVisible(true)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [currentScene, storyStarted])
  
  // No-op: overlay doesn't need artificial height; scenes equal 100vh sections
  
  return (
    <div className="landing" ref={landingRef}>
      <header className="landing-header">
        <div className="logo">
          <img src={`${import.meta.env.BASE_URL}assets/Camel.png`} alt="Camel logo" />
        </div>
        <div className="chapter-nav">
          <button style={{fontFamily: 'El Messiri'}} onClick={() => handleChapterClick('intro')} className="start-button">Start</button>
          <button style={{fontFamily: 'El Messiri'}} onClick={() => handleChapterClick('farsia-village')} className="start-button">Al-Farsiya</button>
          <button style={{fontFamily: 'El Messiri'}} onClick={() => handleChapterClick('naama-nueima')} className="start-button">Nu'eima</button>
          <button style={{fontFamily: 'El Messiri'}} onClick={() => handleChapterClick('west-bank')} className="start-button">Energy Apartheid</button>
          <button style={{fontFamily: 'El Messiri'}} onClick={() => handleChapterClick('globe-scene')} className="start-button">Global Complicity</button>
        </div>
        <nav className="landing-nav">
          <Link target="_blank" to="https://caravancollective.org/"><span style={{fontFamily: 'El Messiri'}}>Caravan</span> <span style={{fontFamily: 'Suisse Intl'}}>Collective</span></Link>
          
        </nav>
      </header>
      <div className={`landing-map ${isMobile ? 'mobile-map' : ''}`}>
        <MapCanvas 
          onReady={setMapInstance} 
          //showVideoPoints={currentScene === 'farsia-village'} 
          grayscale={currentScene === 'intro' || currentScene === 'intro-2' || currentScene === 'globe-scene' || currentScene === 'globe-scene-2' || currentScene === 'globe-scene-3' || currentScene === 'globe-scene-4' || currentScene === 'globe-scene-5'}
          scrollContainer={landingRef.current}
          visibleSiteIds={visibleSiteIds}
          currentScene={currentScene}
          isMobile={isMobile}
        />
      </div>
      
      <div className="scroll-container">
        {/* Intro scene - landing hero */}
        <SceneSection sceneId="intro" isMobile={isMobile} showHero={heroVisible}>
          {heroVisible && (
            <div className="hero-card">
              <h1 className="hero-title">The Occupation of the Sun</h1>
              <div className="hero-body">
              <p>Research and documentary project investigating how Israel employs the use of solar energy as a means of Palestinian land confiscation and exploitation in the occupied West Bank. We focus on the Jordan Valley in the northern West Bank, looking at two Palestinian villages – Al-Farsiya and Nu'eima, and two Israeli settlements – Shadmot Mehola and Na'ama. </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/* Scroll indicator - only visible on intro scene and before user scrolls */}
        {showScrollIndicator && currentScene === 'intro' && (
          <div className="scroll-indicator">
            <img 
              src={`${import.meta.env.BASE_URL}assets/scroll.png`} 
              alt="Scroll down" 
              className="scroll-indicator-icon"
            />
          </div>
        )}

        {/* Sub Intro scene - combineOnMobile ensures map legend shows alongside West Bank overlay on mobile */}
        <SceneSection sceneId="sub-intro" isMobile={isMobile} showHero={heroVisible} combineOnMobile={true}>
          {heroVisible && (
            <div className="hero-card-legend">
              <h1 className="hero-title">Map Legend</h1>
              <div className="hero-body">
                <ul style={{listStyleType: 'none', padding: 0, margin: 0}}>
                  <li style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><img style={{width: '20px', height: '20px', marginRight: '12px'}} src={`${import.meta.env.BASE_URL}assets/icons/Palestinian-Villages.png`} alt="Palestinian Villages" />Palestinian Villages</li>
                  <li style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><img style={{width: '20px', height: '20px', marginRight: '12px', opacity: 0.5}} src={`${import.meta.env.BASE_URL}assets/icons/Israeli-Settlements.png`} alt="Israeli Settlements" />Israeli Settlements</li>
                  <li style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><img style={{width: '20px', height: '20px', marginRight: '12px'}} src={`${import.meta.env.BASE_URL}assets/icons/The-Green-Line.png`} alt="The Green Line" />The Green Line</li>
                  <li style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><img style={{width: '20px', height: '20px', marginRight: '12px'}} src={`${import.meta.env.BASE_URL}assets/icons/Area-A.png`} alt="Area A" />Area A: Under Palestinian Authority control.</li>
                  <li style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><img style={{width: '20px', height: '20px', marginRight: '12px'}} src={`${import.meta.env.BASE_URL}assets/icons/Area-B.png`} alt="Area B" />Area B: Under Palestinian civil law, Israel military control. </li>
                  <li style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><img style={{width: '20px', height: '20px', marginRight: '12px'}} src={`${import.meta.env.BASE_URL}assets/icons/Area-C.png`} alt="Area C" />Area C: Under Israeli civil and military control. </li>
                </ul>
              </div>
            </div>
          )}
        </SceneSection>
        
        {/* Al-Farsia village scene */}
        <SceneSection sceneId="farsia-village" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">AL-FARSIYA</h1>
              <div className="hero-body">
                <p>Barely a couple of kilometres apart, the Palestinian village of <strong>Al-Farsiya Naba’a Al-Ghazzal</strong> and the Israeli settlement of <strong>Shadmot Mehola</strong> face two starkly different everyday realities.
                </p>
                <p>By examining the disparity in access to solar energy use and production, The Occupation of the Sun narrates how <strong>Palestinian energy self-reliance is undermined by large-scale infrastructure projects that bolster Israeli settlements, backed by global investors and institutions.</strong>
                </p>
                <p><i>The Occupation of the Sun</i> reveals only a part of the complex and deeply rooted systems of oppression and apartheid that characterise Israel's occupation of Palestine.</p>
              </div>
            </div>
          )}
        </SceneSection>

        {/* Al-Farsia village scene 2*/}
        <SceneSection sceneId="farsia-village-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">AL-FARSIYA</h1>
              <div className="hero-body">
              <p>In the northern edge of the Jordan Valley, is the village of <strong>Al-Farsiya Naba’a Al-Ghazzal.</strong></p>
              <p>For 47 years, the tiny hamlet, home to roughly 20 members of the Daraghme family, has survived under Israeli occupation.</p>
              <p>All of the community electricity comes from a handful of solar panels. They once had a generator, but it was destroyed during one of several settler attacks in April 2024</p>
              <p><strong>Al-Farsiya is one of the last remaining Palestinian shepherding communities in the Jordan Valley.</strong> Most others have already been displaced. The Daraghme family counts a few hundred sheep and a small strip of barley fields, an economy steadily strangled by nearby settler outposts which block access to grazing land and routinely damage crops by running their own flocks through the fields. Tubas, the closest Palestinian town, used to be a half-hour drive away; now, with the Israeli military’s closure of the Al-Hamra checkpoint for nearly two years, every trip requires a multi-hour detour.
</p>
              </div>
            </div>
          )}
        </SceneSection>
        
        {/* Al-Farsia Video scene */}
        <SceneSection sceneId="farsia-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">AL-FARSIYA Community</h1>
              <div className="hero-body">
                <div className="video-container">
                  <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/1eC69czxqpQDPm6fXnR4hcI-ETMKqHas7/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Al-Farsiya Community Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>
        
         {/* Al-Farsia village scene 2*/}
         <SceneSection sceneId="rotem" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">AL-FARSIYA</h1>
              <div className="hero-body">
                <p>
                Across Area C, which makes up more than 60% of the West Bank and is under full Israeli military control, solar power is often the only available source of electricity for Palestinian herding communities — like Al-Farsiya. <strong>Israel has refused to connect these communities to the grid, despite its <a href="https://www.un.org/en/genocideprevention/documents/atrocity-crimes/Doc.33_GC-IV-EN.pdf" target="_blank" >obligation</a> under international humanitarian law to provide basic services to the population under occupation. </strong>
                </p>
                <p>
                <strong>Al-Farsiya</strong>’s solar panels were installed by <a href="https://comet-me.org/" target="_blank">Comet-ME</a> – an organization that provides renewable energy to communities in the West Bank that have been rendered “off-the-grid” by the occupation. These panels are repeatedly vandalized and rendered inoperable by actors that enforce the occupation.

                </p>
                <p>
                “There's the settlers, and there’s the army,” said 32-year-old Ahmad Daraghme, the hamlet’s informal leader. “Every other day they come to attack us.” Human rights group Jordan Valley Activists reports that in September 2023 nine masked settlers <a href="https://www.instagram.com/reel/Cw-1L0BtvxP/?igsh=dzMyNWZtejFzOXph" target="_blank">assaulted him</a> on his grazing lands, breaking his hand with an iron bar, leaving him in a cast for weeks; Israeli police declined to investigate. 

                </p>
                <p>
                The violence <a href="https://www.btselem.org/settler_violence_updates_list?type=All&article_date%5Bmin%5D=2015-01-01&article_date%5Bmax%5D=2025-11-20&area=All&district=All&locality=203187&page=0" target="_blank">escalated</a> in April 2024, when dozens of settlers stormed Al-Farsiya at night, attacking residents, burning a car and smashing nearly every solar panel. Police again refused to open a case. 
                </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/* Rotem Video scene */}
        <SceneSection sceneId="rotem-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Energy In AL-FARSIYA</h1>
              <div className="hero-body">
                <div className="video-container">
                <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/1IN_IAOZdGmLy2C-crf1Rn-fEep0jwp7b/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Shadmot Mehola Settlement Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>

        {/*settlements scene*/}
        <SceneSection sceneId="settlements" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1>
              <div className="hero-body">
                <p>Israel has set ambitious targets to expand its solar energy capacity – by 2030, the government aims to generate <strong>30% of the nation's electricity from renewable sources.</strong> Former Energy Minister Yuval Steinitz <a href="https://www.jpost.com/israel-news/govt-approves-plan-for-30-percent-of-israels-energy-to-be-renewable-by-2030-646886" target="_blank">said</a> the plan would require tripling existing Israeli solar energy infrastructure. 
                </p>
                <p>To achieve its objectives, Israel plans to increase its installed solar capacity to approximately 17 gigawatts – with new large-scale solar farms, energy storage solutions, and campaigns that promote rooftop solar installations across the country. 
                </p>
                <p>
                The irony is impossible to miss: <strong>while Israel promotes its green energy initiatives and environmental policies, it systematically exploits Palestinian land, water, and natural resources</strong> on which Israel’s “green energy” is entirely dependent.
                </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*shdemot mehola scene*/}
        <SceneSection sceneId="shdemot-mehola" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1>
              <div className="hero-body">
                <p>Settlements are increasingly powered by large, internationally funded solar farms, while Palestinian communities in the same areas struggle simply to keep the lights on. <strong>The rapid expansion of solar energy in the West Bank has become a tool of colonization, land seizure, and resource extraction, packaged as “green development.” </strong>
                </p>
                <p>
                The result is two starkly different energy realities in one territory – what has been termed <strong>“Energy Apartheid”</strong>. 
 

                </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*shdemot mehola zoom scene*/}
        <SceneSection sceneId="shdemot-mehola-zoom" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1> 
            <div className="hero-body">
            <p>Just a 10-minute drive from <strong>Al-Farsiya</strong>, set in a parallel, luxurious, dystopian reality, is the settlement of <strong>Shadmot Mehola</strong>. While <strong>Al-Farsiya</strong> struggles to keep a few fragile solar panels standing, international companies are profiting from the Israeli settlements around it. </p>

            <p><a href="https://www.bikathayarden.co.il/יישובי-הבקעה/שדמות-מחולה/" target="_blank">Founded</a> in 1979 as part of a broader effort to build up Israeli military infrastructure along the Jordanian border, <strong>Shadmot Mehola</strong> became a civilian settlement in 1984 and is now home to roughly 650 residents – farmers, teachers, lawyers and other professionals. 
            </p>
              <p>Four soldiers guard the settlement’s large electric gate. Beyond the fence, the Jordan Valley’s natural desert terrain gives way to <strong>Shadmot Mehola’s</strong> carefully reshaped landscape: flourishing – albeit foreign – trees line the sidewalks, manicured lawns surround neat, tiled-roofed houses, and even the air seems clearer within the enclosure.
              </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*shdemot mehola zoom scene 2*/}
        <SceneSection sceneId="shdemot-mehola-zoom-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Settlement</h1> 
            <div className="hero-body">
            <p>Noam Bigon, the settlement administrator, welcomed us into his air-conditioned office, offering tea and coffee in front of a large map of the settlement. 
              </p>
              <p>
              He traced the locations of synagogues, community centers, schools, swimming pools, and a wide zoned area for 120 prefabricated housing units – single-family homes that, he said proudly, could be assembled in just two weeks. 
              </p>
              <p>
              <strong>“Families from all over the country want to live here,”</strong> he said. <strong>“There’s a calm environment.”</strong>
              </p>
              </div>
            </div>
          )}
        </SceneSection>

         {/* Shdemot Mehola Video scene */}
         <SceneSection sceneId="shdemot-mehola-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Life in Shadmot Mehola Settlement</h1>
              <div className="hero-body">
                <div className="video-container">
                <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/10N4cKdGfYanMGWEncFd-A-zMiafnESVH/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Shadmot Mehola Settlement Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>

        {/*shdemot mehola out scene*/}
        <SceneSection sceneId="shdemot-mehola-out" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Solar Field</h1>
              <div className="hero-body">
              <p><strong>Al-Farsiya</strong>’s dirt path tapers out into a half-kilometer of gleaming solar panels, each row lined up on smooth pavement. These panels, Bigon explained, are connected directly to the <strong>Israel Electric Corporation</strong> – the national grid. 
              </p>
              <p>Built in 2016, the installation covered more than 50,000 square meters and produced five megawatts of electricity, <a href="https://www.themarker.com/dynamo/2016-07-20/ty-article/0000017f-f102-d497-a1ff-f382988f0000" target="_blank">financed</a> by 40 million NIS of private Israeli investments. <strong>The land beneath the solar field had been <a href="https://palestina-komitee.nl/wp-content/uploads/2017/11/3-Cultivating-Dispossession-Israel-Settlements-in-the-Jordan-Valley-Maan-Development-Center-2013A-1.pdf" target='_blank'>expropriated</a> in 1997 from the Palestinian Tubas governorate</strong> and transferred to the settlement through the World Zionist Organisation. 

              </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*shdemot mehola solar field scene*/}
        <SceneSection sceneId="shdemot-mehola-solar-field" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola Solar Field</h1>
              <div className="hero-body">
              <p>Another project is also underway. In 2023, the Israeli Civil Administration <a href="https://apps.land.gov.il/IturTabotData/takanonim/yosh/7002265.pdf" target="_blank">outlined plans</a> for a “solar gate” that would encircle the entire settlement of <strong>Shadmot Mehola</strong>. “We are doing an innovative project,” Bigon explained. “The settlement's gate itself will be made out of solar panels. It will produce its own security lighting. Come back in two years (2027), and you will see.”

              </p>

              <p>The solar panel field operates under a special arrangement between the Ministry of Energy and the Electricity Authority for <strong>Israeli</strong> entrepreneurs in the occupied West Bank. The arrangement guarantees that the Israeli state will buy electricity produced by settlement solar panels for at least 20 years at an unusually high rate of <a href="https://www.themarker.com/dynamo/2016-07-20/ty-article/0000017f-f102-d497-a1ff-f382988f0000" target="_blank">0.51–0.54</a> NIS (.16 -.17 USD) per kilowatt.

              </p>
              <p>When asked if the residents of <strong>Shadmot Mehola</strong> cared about the environmental significance of the panels, Bigon emphasized that, above all, the community profits off the solar energy arrangement. <strong>“On the panels, you can draw a dollar sign,”</strong> he said. <strong>“That is their meaning.”</strong> 

              </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/* Shdemot Mehola Video scene */}
        <SceneSection sceneId="shdemot-mehola-solar-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Shadmot Mehola Solar Field</h1>
              <div className="hero-body">
                <div className="video-container">
                <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/12s9mW3DdqST1dKR9zDW85qQPp881Q-CV/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Shadmot Mehola Solar Field Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>


        {/*settlements-2 scene*/}
        <SceneSection sceneId="settlements-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola & Al-Farsiya</h1>
              <div className="hero-body">
              <p>The relationship between <strong>Shadmot Mehola</strong> and <strong>Al-Farsiya</strong> runs far deeper than energy disparity and land seizure. According to evidence collected by the human rights group Jordan Valley Activists (JVA), settlers from <strong>Shadmot Mehola</strong> have for years been <a href="https://www.btselem.org/settler_violence_updates_list?type=All&article_date%5Bmin%5D=2015-01-01&article_date%5Bmax%5D=2025-11-20&area=All&district=All&locality=203187&page=1" target="_blank">involved in violent attacks</a> targeting <strong>Al-Farsiya</strong>.

              </p>
              <p>
              In September 2023, the settlers who broke Ahmad’s hand with an iron bar <a href="https://www.instagram.com/reel/Cw-1L0BtvxP/?igsh=dzMyNWZtejFzOXph" target="_blank">came</a> from <strong>Shadmot Mehola</strong>. JVA states that among them were the Rosenberg brothers – the grandsons of the rabbi who founded the settlement’s religious school. The settlement’s security coordinator watched the attack play out without intervening, said one of the activists who was present at the scene. 
              </p>
              <p>
              On June 9, 2025, two settlers walked down from <strong>Shadmot Mehola</strong> and <a href="https://www.instagram.com/p/DK0CUiMtAhJ/?img_index=9&igsh=MXU1MTNvaGl6NTd6dg==" target="_blank">began</a> constructing a 150-meter fence just two meters away from <strong>Al-Farsiya</strong>’s homes, cutting off the village from its remaining land.
              </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*sub-intro-2 scene*/}
        <SceneSection sceneId="sub-intro-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Shadmot Mehola & Al-Farsiya</h1>
              <div className="hero-body">
                <p>The brutal violence inflicted on Ahmad and his family is not separate from the settlement's glossy green energy projects. They are two parts of the occupation's campaign <strong>designed to remove Palestinian communities from the Jordan Valley and replace them with Israeli settlers.</strong>
                </p>
                <p>The men who engineered the solar panels and the men who attacked Ahmad live in the same houses, and work toward the same end. 
                </p>
              </div>
            </div>
          )}
        </SceneSection>
         {/*naama-nueima scene*/}
         <SceneSection sceneId="naama-nueima" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
              <p>In the southern Jordan Valley lies the Israeli settlement of <strong>Na'ama</strong>, <a href="https://apps.land.gov.il/IturTabotData/takanonim/yosh/7001940.pdf" target="_blank">established</a> in 1982 on land of the Palestinian village of <strong>Nu’eima</strong>. According to ARIJ’s GIS Unit (2011), the Israeli <a href="http://vprofile.arij.org/jericho/pdfs/vprofile/'Ein%20ad%20Duyuk%20&%20An%20Nuwei'ma_en_FINAL.pdf" target="_blank">government</a> seized 5,048 dunums – roughly 10.4% of the village’s total area – and transferred them to the new settlement’s Master Plan.
              </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/*naama scene*/}
        <SceneSection sceneId="naama" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
              <p>For several years, the settlement was formally renamed Na'omi before the original name, <strong>Na'ama</strong>, was reinstated. 

              </p>
              <p>As of today, <strong>Na’ama’s</strong> population <a href="https://www.bikathayarden.co.il/יישובי-הבקעה/נעמה/" target="_blank">stands</a> at 48 families, who follow a communal secular lifestyle.
              </p>
              <p>The residents of <strong>Na’ama</strong> are mainly engaged in agriculture: growing dates, green herbs, orchards, and vegetables. Agricultural goods are exported both locally and internationally. 
              </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/*naama scene*/}
        <SceneSection sceneId="naama-zoom" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Settlement</h1>
              <div className="hero-body">
                <p>We interviewed Gil, born and raised in <strong>Na’ama</strong>, now working as a farmer. He told us about the newest solar panel field planned for construction beginning in early 2026, and showed us the large plot of land allocated for it. 
                </p>
                  <p><strong>When built, it will be the largest solar installation in the West Bank.</strong>
                  </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/* Na'ama Video scene */}
        <SceneSection sceneId="naama-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Life In Na'ama Settlement</h1>
              <div className="hero-body">
                <div className="video-container">
                <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/17JvU2OaXflgFEpe-6vBeUuCbKVETgt-_/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Na'ama Settlement Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>
        {/*naama-2 scene*/}
        <SceneSection sceneId="naama-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Na'ama Solar Field</h1>
              <div className="hero-body">
              <p>The Israeli solar energy field in <strong><a href="https://www.eeas.europa.eu/delegations/palestine-occupied-palestinian-territory-west-bank-and-gaza-strip/eu-and-partners-tour-renewable-energy-sites-northern-jericho-voice-concerns-over-israeli-settlement_en#:~:text=During%20the%20tour%2C%20the%20delegation,of%20a%20two%2Dstate%20solution." target="_blank">Na’ama</a></strong> stood out for its vastness and elevated technological infrastructure, in an area where many Palestinian communities, especially Bedouin, barely have the means to secure essential needs. Expanding over 100,000 square meters, the field has the energetic capacity of nearly 10 megawatts.  
              </p>
              <p>The development was financed by Israeli institutions, the main ones being <strong>Ariel University</strong>, the council from the <strong>Na’ama</strong> settlement itself, and the <strong><a href="https://www.whoprofits.org/companies/company/7362?teralight" target="_blank">Teralight company</a></strong>, which is publicly traded and partially owned by the Insurance colossus <strong>Menorah Mivtachim Holdings</strong>, an Israeli insurance and pension company that operates in the <strong>UK, US, Russia, and Cyprus</strong>, <a href="https://www.whoprofits.org/companies/company/7356" target="_blank">according</a> to Who Profits.  
              </p>
              <p>The land on which <strong>Na’ama</strong> settlement and solar field sit <a href="http://vprofile.arij.org/jericho/pdfs/vprofile/'Ein%20ad%20Duyuk%20&%20An%20Nuwei'ma_en_FINAL.pdf" target="_blank">was</a> once privately owned Palestinian Bedouin land. Now, the sole profiters of the energy produced by the land are settler colonies throughout the state.
              </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/* Na'ama solar Video scene */}
        <SceneSection sceneId="naama-solar-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Na'ama Solar Field</h1>
              <div className="hero-body">
                <div className="video-container">
                <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/1EFsjGiorU5O67F6Fgu1s-dhQ6x1632_r/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Na'ama Solar Field Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>
        {/*naama-nueima scene*/}
        <SceneSection sceneId="naama-nueima-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Nu'eima</h1>
              <div className="hero-body">
                <p><strong>Nu’eima</strong> is a Palestinian village, with documented roots dating back to the Ottoman census. It had for centuries been known for the exportation of fruits and for its fertile arable lands. <strong>After the village fell under Israeli occupation in 1967, over 5,000 of its dunams were <a href="http://vprofile.arij.org/jericho/pdfs/vprofile/'Ein%20ad%20Duyuk%20&%20An%20Nuwei'ma_en_FINAL.pdf" target='blank'>confiscated</a></strong> in order to construct the Israeli settlement of <strong>Na’ama</strong>, and today most of its land falls under Area C, making it under direct control of the Israeli military.  
                </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/*nueima zoom scene*/}
        <SceneSection sceneId="nueima-zoom" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Nu'eima</h1>
              <div className="hero-body">
              <p>The need for sustainable energy systems is undeniable. But Israel’s self-portrait as a sustainable state also serves a political purpose, <strong>obscuring the extent to which its renewable energy simultaneously fuels and relies on the seizure of Palestinian land.</strong>
                </p>
                <p>The structural imbalance stretches back decades. Since the 1990s, following the Oslo Accords (<a href="https://peacemaker.un.org/en/node/9432" target="_blank">I</a> & <a href="https://www.un.org/unispal/document/auto-insert-185434/" target="_blank">II</a>) and the <a href="https://unctad.org/system/files/information-document/ParisProtocol_en.pdf" target="_blank">Paris Protocol</a>, Palestinian trade, including energy, has been bound to Israeli-controlled supply channels. Because of this, the Palestinian Authority purchases <a href="https://unispal.un.org/pdfs/WB_ACS9393.pdf#:~:text=commercial%20agreement%20for%20the%20sale%20and%20purchase" target="_blank">over 90%</a> of its electricity from the <strong>Israel Electric Corporation</strong> (IEC), with distribution handled by companies like the <strong>Jerusalem District Electricity Company</strong> (JDECO). This arrangement leaves Palestinian institutions responsible for distribution, but without sovereignty over generation or supply.
                </p>
                <p>The IEC, for its part, sources power from industrial zones, including <a href="https://peacenow.org.il/en/power-plants-in-settlements" target="_blank">those in the occupied West Bank</a> and in the Naqab/Negev, thereby <strong>embedding energy production within the same territorial regime that underpins settlement expansion and land appropriation.</strong> 
                </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/*nueima solar scene*/}
        <SceneSection sceneId="nueima-solar" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Noor Jericho Solar Power Station</h1>
              <div className="hero-body">
                <p>Palestinian civil society has been making attempts to counter the energy apartheid through its own initiatives. In the Jericho Governorate there are several such projects, such as the <strong>Noor Jericho Solar Power Station</strong> and the <strong>solar plant in Nu’eima</strong>, constructed in 2017 and connected to the grid in 2018.
                </p>
                <p>Nu'eima solar field is connected to the JDECO and was funded by the Palestine Investment Fund. The JDECO was founded in 1914 and is the largest and oldest electricity distributor in the Palestinian territories. The company serves <a href="https://www.palestine-studies.org/en/node/1654826#:~:text=supplies%20more%20than%2050%25%20of%20the%20demand"target="_blank">over 50% of Palestine's electricity demand</a>, yet it purchases most of its power <a href="https://mas.ps/cached_uploads/download/migrated_files/20191012104921-1-1640017464.pdf" target="_blank">directly</a> from Israel Electric Corporation (IEC), with minor imports <a href="https://unispal.un.org/pdfs/WB_ACS9393.pdf#:~:text=commercial%20agreement%20for%20the%20sale%20and%20purchase" target="_blank">(5%) from Jordan's JEPCO</a>. The IEC <a href="https://peacenow.org.il/en/power-plants-in-settlements" target="_blank">retains</a> the ultimate control over energy infrastructure in the West Bank, limiting the impact of autonomous Palestinian energy generation projects.
                </p>
                <p>Nevertheless, as one Palestinian electrical engineer explained, "The primary objective of our solar panel plants is to minimize dependency on electricity supplied by the Israeli Electricity Company by reducing imported energy."
                </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/* Nu'eima Solar Video scene */}
        <SceneSection sceneId="nueima-solar-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Noor Jericho Solar Power Station</h1>
              <div className="hero-body">
                <div className="video-container">
                <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/1Rv5I0d2RIGnmHaqhDSZeTZztU1o3-XR7/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Noor Jericho Solar Power Station Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>
        {/*nueima zoom 2 scene*/}
        <SceneSection sceneId="nueima-zoom-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Energy In Nu'eima</h1>
              <div className="hero-body">
                <p>Electrical Engineers Mohammed Kamaal and Abdeljawad Al-Fataftah, working at a private sector Palestinian contracting company, explained to us how <strong>Palestinians are trying to disengage with the obligation from the occupation that forces JDECO to structurally and economically depend on Israel.</strong> 
                </p>
                <p>The engineers oversee several projects in areas A and B where Palestinians have set up smaller-scale solar panel fields. With funding from the Palestine Investment Fund, <a href="https://www.pif.ps/content/21" target="_blank">500 schools</a> are set to be equipped with solar-panelled rooftops, and <a href="https://www.pif.ps/content/21" target="_blank">three larger solar-panel fields</a> (including the one in Jericho, the largest) have been constructed across the West Bank.
                </p>
                <p>
                <strong>But facing the mammoth-sized industry and interests backing Israel's "green energy" push is challenging, particularly given Israeli control over land allocation in the vast majority of the land in the West Bank.</strong>
                </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/*beit al ajdad scene*/}
        <SceneSection sceneId="beit-al-ajdad" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card">
              <h1 className="hero-title">Beit Al-Ajdad Elderly Care Home</h1>
              <div className="hero-body">
                <p>As part of this effort, they toured us around <strong>Beit Al Ajdad</strong>, an elderly care home, which is almost entirely powered through solar panels, strategically placed on the roofs.
                </p>
              </div>
            </div>
          )}
        </SceneSection>
        {/* Beit Al-Ajdad Video scene */}
        <SceneSection sceneId="beit-al-ajdad-video" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-video">
              <h1 className="hero-title">Beit Al-Ajdad Elderly Care Home</h1>
              <div className="hero-body">
                <div className="video-container">
                <iframe 
                    className="scene-video-embed"
                    src="https://drive.google.com/file/d/1F-QUaTltDcK3eBSwiKc3AINvUsdanBrg/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    title="Beit Al-Ajdad Elderly Care Home Video"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </SceneSection>
        {/*west-bank scene*/}
        <SceneSection sceneId="west-bank" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card" style={isMobile ? {} : {maxHeight: '50vh', overflow: 'auto'}}>
              <h1 className="hero-title">Energy Apartheid</h1>
              <div className="hero-body">
              <p>
              Palestinians in Areas A and B of the West Bank are reliant on <a href="https://mas.ps/cached_uploads/download/migrated_files/20191012104921-1-1640017464.pdf" target="_blank">Palestinian distribution companies</a> (like the JDECO), which first purchase electricity from the IEC. However, distribution in Area C (under administrative and security control of the Israeli Civil Administration (ICA)) falls under the direct responsibility of the IEC, which exclusively serves Israeli settlements.  
              </p>
              <p>
              <strong>As a result, Palestinian residents in Area C must obtain permits from the ICA for any infrastructure activity – including the installation of new energy systems – but approval for such permits is extremely rare (a <a href="https://peacenow.org.il/en/on-israels-decision-for-palestinian-construction-permits-in-area-c" target="_blank">1.96% approval rate</a> between 2009 and 2016). Sources further highlight that <a href="https://www.nrc.no/globalassets/pdf/reports/area-c-is-everything/area-c-is-palestine---october-2024.pdf" target="_blank">not a single permit</a> has been approved for Palestinians in Area C since October 7, 2023.</strong>
            </p>
              <p>Many communities, like Farsiya, are located only a few dozen meters from the Israeli power distribution network but are forbidden from accessing it, and must instead rely on stand-alone solar or hybrid mini-grids <a href="https://www.eeas.europa.eu/node/24279_en" target="_blank">donated</a> by <a href="https://euromedmonitor.org/uploads/reports/SquanderedAid_En.pdf" target="_blank">international</a> <a href="https://www.ftm.eu/articles/eu-investments-in-west-bank-destroyed?share=xrS7RGu06y1ACJAEgeAe7N1LxPEZA%2BZJZJYEx0qWIN7nElvQmfvzfg0C9%2BNPSew%3D" target="_blank">organizations</a> – systems whose construction nonetheless still requires ICA approval.
              </p>
              <p><strong>The Israeli-controlled energy distribution system in West Bank is aimed at the same goal as settler terror — to apply pressure on the Palestinian communities in order to facilitate forcible transfer of the population.</strong>
              </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*west-bank scene*/}
        <SceneSection sceneId="west-bank" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card" style={isMobile ? {} : {maxHeight: '50vh', overflow: 'auto'}}>
              <h1 className="hero-title">Energy Apartheid</h1>
              <div className="hero-body">
              <p><strong>Israel has invested heavily in branding itself as a green pioneer since the early 2010s.</strong> In a 2015 speech to the United Nations, Israel’s ambassador <a href="https://digitallibrary.un.org/record/808009?ln=en" target="_blank">boasted</a> that the country had become “a hub for renewable energy research and development.” 
                </p>
                <p>“The same sun that shines equally on all of us, is owned by none of us, and can supply energy in abundance, inherently promotes peace,” he continued.
                </p>
                <p>This self-branding became much more aggressive after 2020, when Israel <a href="https://www.jpost.com/israel-news/govt-approves-plan-for-30-percent-of-israels-energy-to-be-renewable-by-2030-646886" target="_blank">announced</a> its 2030 renewable energy targets.
                </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*west-bank scene*/}
        <SceneSection sceneId="west-bank" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card" style={isMobile ? {} : {maxHeight: '50vh', overflow: 'auto'}}>
              <h1 className="hero-title">Energy Apartheid</h1>
              <div className="hero-body">
              <p>Israel’s solar electricity generation <a href="https://www.iea.org/data-and-statistics/data-tools/energy-statistics-data-browser?country=ISR&fuel=Renewables%20and%20waste&indicator=SolarGen" target="_blank">grew</a> from virtually nothing in 2008 to 10,793 gigawatts by 2024 – <a href="https://www.iea.org/countries/israel/renewables" target="_blank">making up 86%</a> of its renewable output.
                </p>
                <p>This rapid buildup doesn’t take place in a vacuum. It is driven by an aggressive set of economic incentives designed to facilitate private investment into the solar market. <strong>Subsidies, long-term feed-in tariffs, guaranteed grid access, and streamlined permitting have turned renewable energy into a highly profitable venture.</strong>
                </p>
                <p>As <a href="https://www.whoprofits.org///writable/uploads/publications/1729673061_82bf7135996905861314.pdf" target="_blank">reported</a> by Who Profits in 2024, “between 2017 and 2022, the Israel Land Authority profited over 184.5 million NIS from solar field projects, approving 68 new transactions with a total capacity of 750 megawatts.”
                </p>
              </div>
            </div>
          )}
        </SceneSection>

        {/*west-bank scene*/}
        <SceneSection sceneId="west-bank" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card" style={isMobile ? {} : {maxHeight: '50vh', overflow: 'auto'}}>
              <h1 className="hero-title">Energy Apartheid</h1>
              <div className="hero-body">
              <p>Contrary to the ambassador’s words, <strong>in the occupied West Bank, the sun does not shine equally on all.</strong> 
                </p>
                <p>International corporations are deeply embedded in the solar infrastructure that underpins Israel’s occupation. Across Area C of the West Bank, and throughout the Naqab/Negev, dozens of foreign companies manufacture, sell, and maintain solar systems that power settlements and industrial zones – either directly or through joint partnerships with Israeli firms. The most commercially entangled countries are the <strong>United States, Germany, China, France, and Italy.</strong> 
                </p>
              </div>
            </div>
          )}
        </SceneSection>


        {/*globe scene - SolarEdge / USA*/}
        <SceneSection sceneId="globe-scene" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-complicity">
              <h1 className="hero-title">Global Complicity</h1>
              <div className="hero-body">
              <p>One of the leading players is <strong>SolarEdge</strong>, a U.S.-based company that has become a central supplier of solar technology <a href="https://www.whoprofits.org///writable/uploads/publications/1668629471_b4d818057ec69d5ed2ca.pdf" target="_blank">panels to settlements</a> such as <strong>Shadmot Mehola</strong>. Founded in 2006 by Guy Sella, a former Israeli National Security Council member, <strong>SolarEdge</strong> <a href="http://phoenix.corporate-ir.net/phoenix.zhtml?c=253935&p=irol-reportsAnnual" target="_blank">has received</a> substantial <a href="https://www.whoprofits.org///writable/uploads/publications/1668629471_b4d818057ec69d5ed2ca.pdf" target="_blank">funding from Israeli government ministries.</a> Listed on <a href="https://www.nasdaq.com/market-activity/stocks/sedg/institutional-holdings" target="_blank">NASDAQ</a> since 2015, it is backed by major global investors including <strong>BlackRock, GMO, UBS, the Royal Bank of Canada, Morgan Stanley, BNP Paribas, Citigroup, and Barclays</strong>. <a href="https://docs.google.com/spreadsheets/d/1GYZGSJ-Eq1PIf9nY3jxNJemEqOG7toS3Mk9A9vCi4sA/edit?usp=sharing" target="_blank">After several attempts to reach out</a>, SolarEdge has not responded to the Caravan Collective's inquiries.
              </p>
              </div>

            </div>
          )}
        </SceneSection>
        {/*globe scene - EDF / France*/}
        <SceneSection sceneId="globe-scene-2" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-complicity">
              <h1 className="hero-title">Global Complicity</h1>
              <div className="hero-body">
              <p>In Europe, <strong>EDF (Électricité de France)</strong> stands out as one of the <a href="https://www.themarker.com/dynamo/2023-07-17/ty-article/.premium/00000189-62bb-dc94-a78d-f3fb28090000" target="_blank">most heavily invested</a> companies in Israel's solar sector. The French energy giant operates multiple fields across the Naqab/Negev with a combined capacity of roughly 160 MegaWatts, and <a href="https://www.enerdata.net/publications/daily-energy-news/israel-awards-300-mw-solar-project-edf-negev-desert.html" target="_blank">recently won a tender</a> to construct what is slated to become Israel’s largest solar facility —with a capacity of 300 megawatts — beginning in 2026.
                </p>
                <p>Although the Naqab/Negev is not considered occupied territory under international law, <strong>it is an area where dozens of Palestinian villages and Bedouin communities have <a href="https://www.adalah.org/uploads/uploads/Bedouin_Primer_August_2022.pdf" target="_blank">faced systematic ongoing displacement</a> since the Nakba.</strong> EDF operates both directly and through subsidiaries such as <strong>EDF Energies Nouvelles Israel</strong>, and partners with <a href="https://www.whoprofits.org/writable/uploads/old/uploads/2018/06/old/solar_flash_report.pdf" target='_blank'>firms like <strong>Solex</strong></a>. It also maintains a commercial relationship with <strong>Shikun & Benui</strong>, an Israeli company involved in the construction and management of solar fields in the West Bank and abroad. EDF <a href="https://docs.google.com/spreadsheets/d/1GYZGSJ-Eq1PIf9nY3jxNJemEqOG7toS3Mk9A9vCi4sA/edit?gid=1080653422#gid=1080653422" target="_blank">has not replied</a> to the Caravan Collective's inquiries for comment in time for publication.
                </p>
              </div>

            </div>
          )}
        </SceneSection>
        {/*globe scene - Enerpoint / Italy*/}
        <SceneSection sceneId="globe-scene-3" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-complicity">
              <h1 className="hero-title">Global Complicity</h1>
              <div className="hero-body">
              <p>The Italian-linked <strong>Enerpoint Israel</strong>, originally founded as a subsidiary of <strong>Enerpoint Italy</strong> before becoming independent, is another major contractor in both the Naqab/Negev and the West Bank. <a href="https://web.archive.org/web/20150720085813/http://www.energianews.com/article.php?id=21359" target="_blank">In partnership with the Israeli company Green Is Us</a>, it built the large <strong><a href="https://novact.org/wp-content/uploads/2024/02/2c_Greenwashing_Inform_ENG_v2.pdf" target="_blank">Netiv Hagdud</a></strong> industrial solar field — one of the <a href= "https://www.whoprofits.org/companies/company/3693?suntech" target="_blank">most profitable</a> in the West Bank. Enerpoint <a href="https://docs.google.com/spreadsheets/d/1GYZGSJ-Eq1PIf9nY3jxNJemEqOG7toS3Mk9A9vCi4sA/edit?gid=1080653422#gid=1080653422" target="_blank">has failed to comment</a> in time for publication, and its website has not been retrievable since 2024, as it redirects to the Israeli company <strong>Colmobil Energy.</strong>
              </p>
              </div>

            </div>
          )}
        </SceneSection>
        {/*globe scene - Siemens / Germany*/}
        <SceneSection sceneId="globe-scene-4" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-complicity">
              <h1 className="hero-title">Global Complicity</h1>
              <div className="hero-body">
                <p>German capital is also deeply involved. German firms, including <strong><a href="https://www.whoprofits.org/companies/company/5735?padcon" target="_blank">PADCON</a> (<a href="https://belectric.com/belectric-repowers-large-scale-project-in-israel/Belectric" target="_blank">Belectric</a>)</strong> and <strong><a href="https://www.whoprofits.org/companies/company/3728?" target="_blank">Refu Elektronik</a></strong>, have directly supplied solar equipment to West Bank settlements such as <strong>Kalia</strong> and <strong>Netiv Hagdud</strong>. <a href="https://docs.google.com/spreadsheets/d/1GYZGSJ-Eq1PIf9nY3jxNJemEqOG7toS3Mk9A9vCi4sA/edit?gid=1080653422#gid=1080653422" target="_blank">Neither company has replied</a> to the Caravan Collective's inquiries. 
                </p>
                <p><strong><a href="https://www.euro-energie.com/siemens-invests-dollars-15-million-in-israeli-solar-company-arava-power-n-1570" target="_blank">Siemens Project Ventures</a> GmbH</strong> invested early on in the Arava Power Company, which launched one of Israel’s first large-scale solar fields in 2011 in the <a href="https://web.archive.org/web/20220306224003/https://www.whoprofits.org/dynamic-report/tools-of-dispossession-in-the-naqab-development-and-military-projects/" target="_blank">Naqab/Negev</a>. However, the company sold its stake in Arava in 2014, <a href="https://drive.google.com/file/d/1y28hzShCyYtLnnXO5qefCkvs3lliLhw8/view?usp=sharing" target="_blank">as communicated</a> to the Caravan Collective. It stated that the disinvestment “was part of their ongoing active portfolio management”.
                </p>
              </div>

            </div>
          )}
        </SceneSection>
        {/*globe scene - Multiple / Global*/}
        <SceneSection sceneId="globe-scene-5" isMobile={isMobile} showHero={storyStarted}>
          {storyStarted && (
            <div className="hero-card-complicity">
              <h1 className="hero-title">Global Complicity</h1>
              <div className="hero-body">
                <p>Beyond these flagship actors, Israel’s solar fields rely on equipment from a wide network of multinational manufacturers. 
                </p>
                <p>Past reports by <a href="https://www.whoprofits.org///writable/uploads/old/uploads/2018/06/old/solar_flash_report.pdf" target="_blank">Who Profits from 2018</a> show that the following companies had invested or supplied solar panel projects in the Occupied Territories: <strong><a href="https://investigate.afsc.org/company/first-solar" target="_blank">First Solar</a></strong> (US), <strong><a href="https://it.suntech-power.com/wp-content/uploads/download/Publicity-Material/Suntech-Project-Manual.pdf" target='_blank'>SunTech</a></strong> (<a href="https://www.jewsofchina.org/suntech-power-strengthens-ties-with-israeli-companies" target="_blank">China</a>), <strong><a href="https://www.whoprofits.org/companies/company/3711?sma-solar-technology#:~:text=The%20company%20develops%2C%20produces%20and%20sells%20solar,monitoring%20systems%20for%20PV%20systems%2C%20medium%2Dvoltage%20technology%2C" target='_blank'>SMA Solar Technology </a></strong>(Germany), and <strong>ABB </strong>(Switzerland and Sweden). However, following that report, <strong>ABB</strong> “has divested engagements related to solar project sales in the West Bank,” as communicated <a href="https://drive.google.com/file/d/1p6cniUHcepWM73DrMVjTybgxPezxgI7U/view?usp=sharing" target="_blank">in a statement</a> to the Caravan Collective, and “confirms that it does not have a presence in the West Bank.” The other mentioned companies <a href="https://docs.google.com/spreadsheets/d/1GYZGSJ-Eq1PIf9nY3jxNJemEqOG7toS3Mk9A9vCi4sA/edit?gid=1080653422#gid=1080653422" target="_blank">have not responded</a> in time for publication. 
                </p>
              </div>
            </div>
          )}
        </SceneSection>

      

        {/* Loop trigger - scrolling into this will loop back to the start */}
        <div data-scene-id="last-scene" className="scroll-section loop-trigger">
          {storyStarted && (
            <div className="hero-card loop-card">
              
              <div className="hero-body">
                <p>The Israeli colonization of Palestine is carried out through a complicated system of settler violence, military apparati, and seemingly innocuous means, working together to displace Palestinians from their land. <strong>Direct violence clears communities off the land, while 'benign' mechanisms ensure they cannot return.</strong>
                </p>
                <p>Creeping takeover through solar fields doesn't capture as much attention as terror attacks by Israeli settlers and soldiers, allowing it to evade scrutiny. Yet, over the long term, <strong>it is vital to the process of colonization.</strong> 
                </p>
                <p>
                These methods are heavily reliant on support from Europe, the US and beyond; and this support is secured through the branding of land capture as sustainable development. Exposing this greenwashing and <strong>applying pressure on complicit companies through boycotts, divestment, and direct action</strong>, is one of the few levers available to interrupt the process of dispossession.
                </p>
                <h1 className="hero-title"><img src={`${import.meta.env.BASE_URL}assets/scroll.png`} alt="" style={{width: '24px', height: '24px', margin: '0 0 15px 0 !important', verticalAlign: 'middle'  }} /></h1>
              </div>
            </div>
          )}
        </div>
        {/* Loop trigger - scrolling into this will loop back to the start */}
        <div data-scene-id="loop-trigger" className="scroll-section loop-trigger">
          
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
