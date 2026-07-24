import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProfile } from '../../services/profileService'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const [profilePhoto, setProfilePhoto] = useState('')
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
    const syncProfilePhotoFromStorage = () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          setProfilePhoto(parsed.profilePhoto || '')
        } catch (e) {
          console.warn('Could not parse user metadata')
        }
      }
    }

    checkAuth()
    syncProfilePhotoFromStorage()

    const loadProfilePhoto = async () => {
      try {
        const profile = await getProfile()
        if (profile?.profilePhoto) {
          setProfilePhoto(profile.profilePhoto)
        }
      } catch (e) {
        // Silently ignore navbar avatar refresh failures.
      }
    }

    if (localStorage.getItem('authToken')) {
      loadProfilePhoto()
    }
    
    // Listen for storage changes or custom events
    window.addEventListener('storage', checkAuth)
    window.addEventListener('profileUpdated', syncProfilePhotoFromStorage)
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('profileUpdated', syncProfilePhotoFromStorage)
    }
  }, [])

  useEffect(() => {
    const syncProfilePhotoFromStorage = () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          setProfilePhoto(parsed.profilePhoto || '')
        } catch (e) {
          console.warn('Could not parse user metadata')
        }
      }
    }

    const loadProfilePhoto = async () => {
      try {
        const profile = await getProfile()
        if (profile?.profilePhoto) {
          setProfilePhoto(profile.profilePhoto)
        }
      } catch (e) {
        // Silently ignore navbar avatar refresh failures.
      }
    }

    if (isAuthenticated) {
      syncProfilePhotoFromStorage()
      loadProfilePhoto()
    } else {
      setProfilePhoto('')
    }
  }, [isAuthenticated])

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
    navigate('/')
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
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src="/logo.png" 
            alt="JobMate" 
            className="h-10 w-10 object-contain rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-200" 
          />
          <span className="text-2xl font-black tracking-tight text-slate-950 bg-gradient-to-r from-slate-950 via-slate-800 to-violet-700 bg-clip-text text-transparent">
            JobMate
          </span>
        </Link>

        {/* Desktop Navigation */}
        {!isAuthenticated && (
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
              <Link to="/" className="transition hover:text-violet-600">Home</Link>
              <a href="#features" className="transition hover:text-violet-600">Features</a>
              <a href="#how-it-works" className="transition hover:text-violet-600">How It Works</a>
          </nav>
        )}

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="overflow-hidden rounded-full border border-slate-200 shadow-sm">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile avatar" className="h-10 w-10 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-sm font-black text-white">
                    {userMeta.fullName.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-violet-100 transition hover:bg-violet-700 hover:shadow-lg"
              >
                Register
              </Link>
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
                <Link to="/" onClick={() => setIsOpen(false)} className="py-2 hover:text-violet-600 border-b border-slate-50">Home</Link>
                <a href="#features" onClick={() => setIsOpen(false)} className="py-2 hover:text-violet-600 border-b border-slate-50">Features</a>
                <a href="#how-it-works" onClick={() => setIsOpen(false)} className="py-2 hover:text-violet-600 border-b border-slate-50">How It Works</a>
              </>
            )}
            <div className="mt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="overflow-hidden rounded-full border border-slate-200 shadow-sm self-center">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile avatar" className="h-10 w-10 object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-sm font-black text-white">
                        {userMeta.fullName.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center rounded-3xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-800"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center rounded-3xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center rounded-3xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-100"
                  >
                    Register
                  </Link>
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
