'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      alert('Registration successful! Please check your email for the confirmation link.')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-sm text-slate-500 mt-2">Join Lottery Tracker today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-medium px-4 py-3 rounded-xl mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/" className="text-blue-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}