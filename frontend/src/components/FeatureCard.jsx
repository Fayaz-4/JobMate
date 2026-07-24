
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="group relative rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-violet-100/50">
      <div className="absolute inset-x-0 -top-px h-1 rounded-t-[2rem] bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-sm transition-colors duration-300 group-hover:bg-violet-600 group-hover:text-white">
        {icon}
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-violet-600">
        {title}
      </h3>
      
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {description}
      </p>
      
      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-violet-600 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
        <span>Learn more</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </div>
  )
}

export default FeatureCard
