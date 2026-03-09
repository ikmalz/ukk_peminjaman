import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'

export default function MainLayout () {
  const [open, setOpen] = useState(false)

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar />

      {open && (
        <div className='fixed inset-0 z-50 md:hidden'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setOpen(false)} />
          <div className='absolute left-0 top-0 h-full w-64 bg-slate-800 z-50'>
            <Sidebar />
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className='flex flex-col flex-1 md:ml-64 bg-slate-100'>
        <Navbar onMenuClick={() => setOpen(true)} />
        <main className='flex-1 overflow-y-auto p-4 md:p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

