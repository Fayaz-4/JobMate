const VARIANTS = {
  primary: 'bg-violet-600 text-white hover:bg-violet-700',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
}

const Button = ({ type = 'button', variant = 'primary', icon, className = '', children, ...props }) => (
  <button
    type={type}
    className={`inline-flex w-full items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold transition ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {icon ? <span className="flex h-5 w-5 items-center justify-center">{icon}</span> : null}
    {children}
  </button>
)

export default Button
