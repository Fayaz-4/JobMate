import React from 'react'

const CompanyCard = ({ name, jobsCount = 'Active Roles', rating = '4.2' }) => {
  return (
    <div className="group relative rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-violet-200">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors duration-300">
        <span className="text-2xl font-bold text-violet-600">
          {name.substring(0, 2).toUpperCase()}
        </span>
      </div>
      
      <h4 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors duration-200">
        {name}
      </h4>
      
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          ★ {rating} Rating
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
          {jobsCount}
        </span>
      </div>
    </div>
  )
}

export default CompanyCard
