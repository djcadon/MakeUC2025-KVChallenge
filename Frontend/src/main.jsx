import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import KineticVisionDashboard from './dashboard'


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<KineticVisionDashboard />} />
            </Routes>
        </Router>
    </StrictMode>,
)