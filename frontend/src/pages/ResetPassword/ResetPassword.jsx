import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Input from '../../components/Input.jsx'
import { resetPassword } from '../../api/authService.js'

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 5.5c4.208 0 7.645 3.02 8.707 6.5-1.062 3.48-4.499 6.5-8.707 6.5S4.354 15.48 3.292 12C4.354 8.52 7.792 5.5 12 5.5Zm0 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-1.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
  </svg>
)

const SuccessIcon = () => (
  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
      <path d="M9.75 14.5 6.5 11.25l-1.06 1.06L9.75 16.62l9.81-9.81-1.06-1.06L9.75 14.5Z" />
    </svg>
  </div>
)

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.')
    }
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await resetPassword(token, password)
      setSubmitted(true)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 sm:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        {!submitted ? (
          <>
            <div className="space-y-3 text-center">
              <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">JOBMATE</span>
              <h2 className="text-3xl font-bold text-slate-950">Reset Password</h2>
              <p className="text-sm leading-6 text-slate-600">Create a new password for your JobMate account.</p>
            </div>

            {error && (
              <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={(
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-500 hover:text-slate-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <EyeIcon />
                  </button>
                )}
                required
              />
              <Input
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={(
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-500 hover:text-slate-700"
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    <EyeIcon />
                  </button>
                )}
                required
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              <a href="/login" className="font-semibold text-violet-600 hover:text-violet-700">Back to Login</a>
            </p>
          </>
        ) : (
          <div className="space-y-6 text-center">
            <SuccessIcon />
            <div>
              <h2 className="text-3xl font-bold text-slate-950">Password updated successfully.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Your password has been reset.</p>
            </div>
            <a href="/login" className="inline-flex w-full justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-violet-600 transition hover:bg-slate-50">
              Back to Login
            </a>
          </div>
        )}
      </div>
    </main>
  )
}


export default ResetPassword
