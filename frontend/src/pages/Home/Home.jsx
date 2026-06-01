import React, { useEffect, useState } from 'react'
import { fetchHomeStats } from '../../api/homeService'
import FeatureCard from '../../components/FeatureCard'

const Home = () => {
  const [stats, setStats] = useState({
    totalJobs: 1200,
    totalCompanies: 250,
    totalUsers: 5000,
  })
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken')
    setIsAuthenticated(!!token)

    // Fetch stats from backend
    fetchHomeStats()
      .then((data) => {
        if (data) {
          setStats({
            totalJobs: data.totalJobs || 1200,
            totalCompanies: data.totalCompanies || 250,
            totalUsers: data.totalUsers || 5000,
          })
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live database statistics. Using fallback default stats.', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Mock Company Data
  const logoMarqueeItems = [
    { name: 'Google', src: '/images/google.webp' },
    { name: 'Microsoft', src: '/images/microsoft.webp' },
    { name: 'Amazon', src: '/images/amazon.webp' },
    { name: 'IBM', src: '/images/ibm.svg' },
    { name: 'Deloitte', src: '/images/Deloitte.jpg' },
    { name: 'Accenture', src: '/images/accenture.svg' },
    { name: 'Infosys', src: '/images/infosys.svg' },
    { name: 'TCS', src: '/images/tcs.svg' },
    { name: 'Wipro', src: '/images/wipro.svg' },
    { name: 'Capgemini', src: '/images/capgemini.png' },
    { name: 'Cognizant', src: '/images/cognizant.png' },
    { name: 'HCL Technologies', src: '/images/hcl.svg' },
    { name: 'Oracle', src: '/images/oracle.png' },
    { name: 'SAP', src: '/images/sap.svg' },
    { name: 'Zoho', src: '/images/zoho.svg' },
    { name: 'Freshworks', src: '/images/freshworks.webp' },
    { name: 'Meesho', src: '/images/meesho.jpg' },
    { name: 'CRED', src: '/images/cred.png' },
    { name: 'Postman', src: '/images/postman.svg' },
    { name: 'BrowserStack', src: '/images/browser stack.png' },
    { name: 'Physics Wallah', src: '/images/physics wallah.png' },
    { name: 'Upstox', src: '/images/upstock.png' },
    { name: 'Swiggy', src: '/images/swiggy.svg' },
    { name: 'Zomato', src: '/images/zomato.svg' }
  ]

  // Feature Data with Icons
  const features = [
    {
      title: 'Resume Upload',
      description: 'Upload your resume and let our intelligent engine parse it to build a stunning profile automatically.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
      )
    },
    {
      title: 'Skill Extraction',
      description: 'We extract your core technical strengths and soft skills, mapping them visually to industry criteria.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
        </svg>
      )
    },
    {
      title: 'Smart Job Matching',
      description: 'Instantly view curated role recommendations that perfectly align with your extracted skillset.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-8.997M17 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        </svg>
      )
    },
    {
      title: 'Application Tracking',
      description: 'Track the status of all your job submissions in a unified, Kanban-style real-time board.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H5.625a1.125 1.125 0 0 1-1.125-1.125v-2.25c0-.621.504-1.125 1.125-1.125Z" />
        </svg>
      )
    }
  ]

  return (
    <main className="bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* 1. Hero Section */}
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:py-24">
        {/* Abstract Background Blur */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-fuchsia-200/30 blur-3xl" />

        <div className="space-y-8 lg:w-1/2 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 border border-violet-100/50 px-4.5 py-2 text-sm font-bold text-violet-700 shadow-sm animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-600"></span>
            </span>
            Career Growth Simplified
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl leading-[1.1] bg-gradient-to-r from-slate-950 via-slate-900 to-violet-800 bg-clip-text text-transparent">
              Find Jobs That <br className="hidden sm:inline" />Match Your Skills
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600 font-medium">
              Upload your resume, discover relevant opportunities, and track your applications all in one place. JobMate aligns your career goals with live roles instantly.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-200/80 transition hover:bg-violet-700 hover:shadow-xl hover:-translate-y-0.5 duration-200"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 duration-200"
            >
              Learn More
            </a>
          </div>

          {/* Dynamic Platform Statistics Counter */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200/80">
            <div>
              <p className="text-3xl font-black text-slate-950 sm:text-4xl">
                {stats.totalJobs.toLocaleString()}+
              </p>
              <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Live Jobs</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-950 sm:text-4xl">
                {stats.totalCompanies.toLocaleString()}+
              </p>
              <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Companies</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-950 sm:text-4xl">
                {stats.totalUsers.toLocaleString()}+
              </p>
              <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Talents</p>
            </div>
          </div>
        </div>

        {/* Hero Right Visuals - Professional Team Image */}
        <div className="mt-16 lg:mt-0 lg:w-1/2 relative z-10">
          <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2.5rem] border-2 border-slate-200 bg-white shadow-2xl shadow-violet-100">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 z-20" />
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop" 
              alt="Professional team working together"
              className="w-full h-[480px] object-cover rounded-[1.75rem]"
            />
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      {!isAuthenticated && (
        <section id="features" className="border-y border-slate-200/80 bg-white py-24 relative">
          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="mx-auto mb-20 max-w-2xl text-center space-y-4">
              <span className="text-xs font-black uppercase tracking-[0.24em] text-violet-600">Platform Features</span>
              <h2 className="text-3xl font-extrabold text-slate-950 sm:text-5xl tracking-tight leading-none">
                Everything You Need to Scale
              </h2>
              <p className="text-base text-slate-600 font-medium leading-relaxed">
                We leverage advanced resume insights, smart skill tags, and interactive metrics to accelerate how you discover and apply to new roles.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((item) => (
                <FeatureCard 
                  key={item.title} 
                  icon={item.icon} 
                  title={item.title} 
                  description={item.description} 
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. How It Works Section */}
      {!isAuthenticated && (
        <section id="how-it-works" className="py-24 bg-slate-50 relative">
          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="mx-auto mb-20 max-w-2xl text-center space-y-4">
              <span className="text-xs font-black uppercase tracking-[0.24em] text-violet-600">Simple Process</span>
              <h2 className="text-3xl font-extrabold text-slate-950 sm:text-5xl tracking-tight">
                A Smarter Way to Apply
              </h2>
              <p className="text-base text-slate-600 font-medium">
                We have condensed the traditional, complicated job hunt into four highly automated steps.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: '01', title: 'Create Profile', description: 'Fill out basic details and career preferences to customize your match portal.' },
                { step: '02', title: 'Upload Resume', description: 'Drag-and-drop your resume. Our parsing engine reads the layout in seconds.' },
                { step: '03', title: 'Get Matched Jobs', description: 'See highly tailored jobs sorted by an automated Skill-Match Score.' },
                { step: '04', title: 'Apply & Track', description: 'Submit applications directly and track recruiter progress in real time.' },
              ].map((item, index) => (
                <div 
                  key={item.step} 
                  className="group relative rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div className="absolute top-8 right-8 text-5xl font-black tracking-tighter text-slate-100 group-hover:text-violet-100 transition-colors duration-200">
                    {item.step}
                  </div>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-base font-bold text-white shadow-md shadow-violet-100">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 font-medium">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Top Hiring Companies */}
      <section className="relative bg-transparent py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Trusted by top global brands</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Top Hiring Companies
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-8 text-slate-600">
              Connect with leading MNCs and innovative startups hiring through JobMate.
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent sm:w-32" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent sm:w-32" />

            <style>{`
              .marquee {
                overflow: hidden;
              }
              .marquee-track {
                display: inline-flex;
                align-items: center;
                gap: 2rem;
                animation: scroll-left 32s linear infinite;
                will-change: transform;
              }
              .marquee:hover .marquee-track {
                animation-play-state: paused;
              }
              .logo-item img {
                transition: transform 300ms ease;
              }
              .logo-item:hover img {
                transform: scale(1.08);
              }
              @keyframes scroll-left {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>

            <div className="marquee" aria-label="Top hiring company logos">
              <div className="marquee-track">
                {[...logoMarqueeItems, ...logoMarqueeItems].map((item, index) => (
                  <div key={`${item.name}-${index}`} className="logo-item flex min-w-[140px] items-center justify-center">
                    <img
                      src={item.src}
                      alt={item.name}
                      loading="lazy"
                      className="h-14 max-w-[140px] object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call To Action Section */}
      <section className="py-20 relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_22%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        {/* CTA Background Blurs */}
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center space-y-8">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl leading-tight">
            Start Your Career Journey Today
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-400 font-medium">
            Join thousands of smart talents discovering matched roles, tracking submissions, and stepping into the future of automated career growth.
          </p>
          
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-700 duration-200"
              >
                Go to Dashboard
              </a>
            ) : (
              <>
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-700 hover:-translate-y-0.5 duration-200"
                >
                  Create Account
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-700 hover:-translate-y-0.5 duration-200"
                >
                  Login
                </a>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
