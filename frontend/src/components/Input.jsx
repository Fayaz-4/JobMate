const Input = ({ label, type = 'text', placeholder, icon, ...props }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span>{label}</span>
    <div className="relative mt-2">
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        {...props}
      />
      {icon ? (
        <span className="absolute inset-y-0 right-3 flex items-center text-slate-500">{icon}</span>
      ) : null}
    </div>
  </label>
)

export default Input
