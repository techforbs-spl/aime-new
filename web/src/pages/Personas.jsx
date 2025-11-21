import React from 'react'
import PersonaAdminUIPanel from '../components/admin/persona-admin-ui-panel.tsx'

export default function Personas(){
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-8">
        <h1 className="text-3xl font-bold">Persona Admin</h1>
        <p className="text-white/80 mt-1">Create, edit and deploy persona banks across partners.</p>
      </div>
      <div className="rounded-2xl border bg-white p-2 md:p-4">
        <PersonaAdminUIPanel />
      </div>
    </div>
  )
}
