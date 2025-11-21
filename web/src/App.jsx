import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Personas from './pages/Personas.jsx'
import AnalyticsTrends from './components/Analytics/AnalyticsTrends.jsx'

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="personas" element={<Personas />} />
      </Route>
      <Route path="/admin-dashboard" element={<AdminLayout />}>
        <Route path="analytics-trends" element={<AnalyticsTrends />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
