import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Sparkles, LayoutTemplate, Cuboid, MonitorPlay, ChevronRight, UploadCloud, Share2, Save } from 'lucide-react'

// Mock Data
import { mockProjects } from './mock/mockData'

// Screens
import StartScreen from './screens/StartScreen'
import CategoryScreen from './screens/CategoryScreen'
import MainEditor from './screens/MainEditor'
import AssetLibrary from './screens/AssetLibrary'
import ClientView from './screens/ClientView'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f1115] text-[#f8fafc] font-sans selection:bg-indigo-500/30">
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route path="/category" element={<CategoryScreen />} />
          <Route path="/editor/:mode/:category" element={<MainEditor />} />
          <Route path="/assets" element={<AssetLibrary />} />
          <Route path="/client-view/:id" element={<ClientView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
