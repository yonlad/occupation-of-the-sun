import { createContext, useContext, useMemo, useState } from 'react'

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [hoveredSite, setHoveredSite] = useState(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const value = useMemo(() => ({ hoveredSite, setHoveredSite, selectedSite, setSelectedSite }), [hoveredSite, selectedSite])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}



