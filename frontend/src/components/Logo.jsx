const Logo = ({ light = false }) => (
  <div className="inline-flex items-center gap-3">
    <img src="/logo.png" alt="JobMate" className="h-10 w-10 object-contain rounded-full shadow-xs" />
    <div className="space-y-0.5">
      <p className={`text-xl font-bold ${light ? 'text-white' : 'text-slate-950'}`}>JobMate</p>
      <p className={`text-xs uppercase tracking-[0.24em] ${light ? 'text-slate-200' : 'text-slate-500'}`}>Career platform</p>
    </div>
  </div>
)

export default Logo
