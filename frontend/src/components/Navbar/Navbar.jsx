import React, { useState, useEffect } from 'react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userMeta, setUserMeta] = useState({
    fullName: 'SHAIK FAYAZ BASHA',
    email: '',
  })

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken')
      setIsAuthenticated(!!token)
      
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          setUserMeta({
            fullName: parsed.fullName || 'SHAIK FAYAZ BASHA',
            email: parsed.email || '',
          })
        } catch (e) {
          console.warn('Could not parse user metadata')
        }
      }
    }
    
    checkAuth()
    
    // Listen for storage changes or custom events
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setIsAuthenticated(false)
    window.location.href = '/'
  }

  return (
    <header 
      className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${
        isScrolled 
          ? 'border-slate-200 bg-white/90 shadow-sm backdrop-blur-lg py-3' 
          : 'border-transparent bg-white py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <img 
            src="/logo.png" 
            alt="JobMate" 
            className="h-10 w-10 object-contain rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-200" 
          />
          <span className="text-2xl font-black tracking-tight text-slate-950 bg-gradient-to-r from-slate-950 via-slate-800 to-violet-700 bg-clip-text text-transparent">
            JobMate
          </span>
        </a>

        {/* Desktop Navigation */}
        {!isAuthenticated && (
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="/" className="transition hover:text-violet-600">Home</a>
            <a href="#features" className="transition hover:text-violet-600">Features</a>
            <a href="#how-it-works" className="transition hover:text-violet-600">How It Works</a>
          </nav>
        )}

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <a 
                href="/dashboard" 
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Dashboard
              </a>
              <div className="flex items-center gap-3 ml-2 mr-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 shadow-inner font-black text-xs shrink-0 select-none">
                  {userMeta.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left shrink-0 select-none">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{userMeta.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Candidate Account</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-violet-100 transition hover:bg-violet-700 hover:shadow-lg cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a 
                href="/login" 
                className="rounded-full px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </a>
              <a 
                href="/register" 
                className="rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-violet-100 transition hover:bg-violet-700 hover:shadow-lg"
              >
                Register
              </a>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-4 text-base font-semibold text-slate-700">
            {!isAuthenticated && (
              <>
                <a href="/" onClick={() => setIsOpen(false)} className="py-2 hover:text-violet-600 border-b border-slate-50">Home</a>
                <a href="#features" onClick={() => setIsOpen(false)} className="py-2 hover:text-violet-600 border-b border-slate-50">Features</a>
                <a href="#how-it-works" onClick={() => setIsOpen(false)} className="py-2 hover:text-violet-600 border-b border-slate-50">How It Works</a>
              </>
            )}
            <div className="mt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 border border-slate-100 rounded-2xl bg-slate-50/50 justify-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 shadow-inner font-black text-xs shrink-0 select-none">
                      {userMeta.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left shrink-0 select-none">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{userMeta.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Candidate Account</p>
                    </div>
                  </div>
                  <a 
                    href="/dashboard" 
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center rounded-3xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-800"
                  >
                    Dashboard
                  </a>
                  <button 
                    onClick={() => { setIsOpen(false); handleLogout(); }}
                    className="flex justify-center rounded-3xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a 
                    href="/login" 
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center rounded-3xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700"
                  >
                    Login
                  </a>
                  <a 
                    href="/register" 
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center rounded-3xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-100"
                  >
                    Register
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar
