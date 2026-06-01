import Logo from './Logo.jsx'

const AuthLayout = ({ children }) => (
  <main className="min-h-screen bg-slate-50">
    <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-violet-700 px-8 py-10 text-white sm:px-12 lg:px-16">
        <div className="relative z-10 flex flex-col gap-10">
          <Logo light />

          <div className="max-w-xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your Career, Our Mission</h1>
            <p className="text-base leading-8 text-violet-200">
              Join JobMate to analyze your resume, match with relevant opportunities, and track every application with confidence.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              'Resume Analysis',
              'Smart Job Matching',
              'Application Tracking',
            ].map((item) => (
              <div key={item} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-xl text-white">✓</div>
                <p className="text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-x-6 top-6 h-1 rounded-full bg-violet-300/40" />
          <div className="relative mt-4 rounded-3xl bg-slate-950/95 p-6 text-slate-100 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">Workflow</p>
            <div className="mt-8 space-y-6">
              {['Resume', 'Skills', 'Jobs'].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-3xl bg-slate-900/90 px-4 py-4 shadow-inner">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500 text-base font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{step}</p>
                    <p className="text-sm text-slate-400">{step === 'Resume' ? 'Upload your resume' : step === 'Skills' ? 'Extract key strengths' : 'Match with jobs'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-slate-50 px-6 py-12 sm:px-12 lg:px-16">
        {children}
      </section>
    </div>
  </main>
)

export default AuthLayout
