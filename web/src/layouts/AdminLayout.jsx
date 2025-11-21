import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/personas', label: 'Personas' },
  { to: '/admin-dashboard/analytics-trends', label: 'Analytics Trends' },
]

function sidebarLinkClass(active){
  return `flex items-center justify-between rounded-2xl px-4 py-2 text-sm font-medium transition ${
    active ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
  }`
}

export default function AdminLayout(){
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-black via-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">🤖</div>
            <div className="text-lg font-semibold">AIME Admin</div>
          </div>
          <span className="text-xs uppercase tracking-wide text-white/70">control surface</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-64">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Navigation</p>
              <div className="mt-4 flex flex-col gap-2">
                {sidebarLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    end={link.end}
                    to={link.to}
                    className={({isActive}) => sidebarLinkClass(isActive)}
                  >
                    {link.label}
                    {link.to === '/admin-dashboard/analytics-trends' && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">New</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          </aside>
          <section className="flex-1">
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  )
}
