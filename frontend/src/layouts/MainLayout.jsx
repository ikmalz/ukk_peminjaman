import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'

export default function MainLayout () {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className='flex flex-1 flex-col md:ml-[200px] min-w-0 transition-all duration-300'>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className='flex-1 p-5 md:p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
