import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { login, saveToken } from '../../api/authService.js'

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75m19.5 0a48.667 48.667 0 0 0-7.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75" />
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
    <path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm3 0v.25h3v-.25a1.5 1.5 0 0 0-1.5-1.5h-3a1.5 1.5 0 0 0-1.5 1.5Z" clipRule="evenodd" />
  </svg>
)

const Login = () => {
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [password, setPassword] = useState(location.state?.password || '')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(email, password)
      saveToken(response.token)
      localStorage.setItem('user', JSON.stringify({
        fullName: response.fullName,
        email: response.email,
        userId: response.userId,
        role: response.role
      }))
      setSuccess(true)
      setEmail('')
      setPassword('')
      setTimeout(() => (window.location.href = '/dashboard'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 sm:px-12 lg:px-16 flex items-center justify-center">
        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                <path d="M9.75 14.5 6.5 11.25l-1.06 1.06L9.75 16.62l9.81-9.81-1.06-1.06L9.75 14.5Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-950">Login successful!</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Redirecting to your dashboard...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="flex w-full max-w-5xl bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-slate-200 h-auto sm:h-[600px] max-h-[95vh]">
        {/* Left Panel */}
        <div className="flex-1 w-full lg:w-1/2 flex flex-col p-8 sm:px-12 sm:py-10 relative items-center justify-center">
          
          {/* Absolute positioned Logo */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-10 flex items-center gap-3">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-full border-4 border-blue-600 text-blue-600 bg-white">
              <span className="text-xl font-black -mt-1 ml-1 font-serif italic pr-1">j</span>
              <div className="absolute -left-1 bottom-0 bg-blue-600 rounded p-0.5 scale-75">
                 <BriefcaseIcon />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Jobmate</span>
          </div>

          <div className="w-full max-w-[360px] mt-12 sm:mt-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a202c] tracking-tight">
              Welcome back!
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-500">
              Login to your Jobmate account
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <EnvelopeIcon />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <LockIcon />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <EyeIcon />
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <a href="/forgot-password" className="text-xs font-bold text-[#6a35ff] hover:text-[#5523e6] transition">
                    Forgot Password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-[#6a35ff] py-3 text-center text-sm font-bold text-white shadow-lg shadow-[#6a35ff]/30 transition hover:bg-[#5523e6] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-medium text-slate-500">
              Don't have an account?{' '}
              <a href="/register" className="font-bold text-[#6a35ff] hover:text-[#5523e6]">
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Right Panel (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#e8f0fe] to-[#d6e4fc] flex-col items-center justify-center overflow-hidden">
          
          {/* Top Text Content */}
          <div className="absolute top-10 left-10 z-20 space-y-3 max-w-md">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-800 leading-[1.15]">
              Find opportunities.<br/>
              <span className="text-[#0052cc]">Build your future.</span>
            </h2>
            <p className="text-sm font-medium text-slate-600 leading-relaxed pr-10 pt-1">
              Jobmate connects talent with opportunities. Find the right job. Faster.
            </p>
          </div>

          {/* 3D Illustration Graphic generated dynamically to match the aesthetic */}
          <div className="absolute bottom-0 right-0 w-[90%] h-[70%] bg-[url('/login-illustration.png')] bg-contain bg-right-bottom bg-no-repeat z-10"></div>
          
          {/* Extra abstract geometric dots (simulating the background dots in design) */}
          <div className="absolute top-1/4 right-10 grid grid-cols-3 gap-2 opacity-20">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-slate-600"></div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login

