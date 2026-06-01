import { useState } from 'react'
import Button from '../../components/Button.jsx'
import Input from '../../components/Input.jsx'
import { forgotPassword } from '../../api/authService.js'

const EmailSentIcon = () => (
  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
      <path d="M2.25 6A2.25 2.25 0 0 1 4.5 3.75h15a2.25 2.25 0 0 1 2.25 2.25v11.25A2.25 2.25 0 0 1 19.5 18H4.5A2.25 2.25 0 0 1 2.25 15.75V6Zm1.5.75v2.57l7.5 4.5 7.5-4.5V6.75H3.75Zm7.5 5.33-7.5-4.5V15.75c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V7.58l-7.5 4.5Z" />
    </svg>
  </div>
)

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await forgotPassword(email)
      setSent(true)
      setEmail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 sm:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        {!sent ? (
          <>
            <div className="space-y-3 text-center">
              <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">JOBMATE</span>
              <h2 className="text-3xl font-bold text-slate-950">Forgot Password?</h2>
              <p className="text-sm leading-6 text-slate-600">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <Input label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              <a href="/login" className="font-semibold text-violet-600 hover:text-violet-700">Back to Login</a>
            </p>
          </>
        ) : (
          <div className="space-y-6 text-center">
            <EmailSentIcon />
            <div>
              <h2 className="text-3xl font-bold text-slate-950">Check Your Email</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                We've sent a password reset link to your email address.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Click the link in your email to reset your password.</p>
            </div>
            <div className="space-y-4">
              <Button type="button" className="w-full" onClick={() => setSent(false)}>
                Send Another Link
              </Button>
              <a href="/login" className="inline-flex w-full justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-violet-600 transition hover:bg-slate-50">
                Back to Login
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


export default ForgotPassword
