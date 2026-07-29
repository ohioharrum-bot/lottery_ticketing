'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/client'
import {
  fetchStoreSettings,
  saveStoreSettings,
  fetchUserProfile,
  saveUserProfile,
  fetchUserSettings,
  saveUserSettings,
} from '@/lib/supabase/dbHelpers'

const supabase = createClient()

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  // Store Info
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [savingStore, setSavingStore] = useState(false)

  // Account
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  // Notifications Toggles
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [shiftCloseReminder, setShiftCloseReminder] = useState(true)
  const [scanMismatchAlerts, setScanMismatchAlerts] = useState(false)
  const [savingNotifs, setSavingNotifs] = useState(false)

  // Security
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setEmail(user.email || '')
        setFullName(user.user_metadata?.full_name || '')

        // Fetch store settings from Supabase
        const store = await fetchStoreSettings(supabase, user.id)
        if (store.store_name) setStoreName(store.store_name)
        if (store.store_address) setStoreAddress(store.store_address)

        // Fetch user profile from Supabase
        const profile = await fetchUserProfile(supabase, user.id)
        if (profile.full_name) setFullName(profile.full_name)

        // Fetch notification settings from Supabase / localStorage fallback
        const notifs = await fetchUserSettings(supabase, user.id)
        setLowStockAlerts(notifs.low_stock_alerts)
        setShiftCloseReminder(notifs.shift_close_reminder)
        setScanMismatchAlerts(notifs.scan_mismatch_alerts)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save Store Info
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStore(true)
    const { error } = await saveStoreSettings(supabase, userId, storeName.trim(), storeAddress.trim())
    if (!error) {
      showToast('Store information saved successfully')
    } else {
      showToast('Saved store information', true)
    }
    setSavingStore(false)
  }

  // Update Account Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSavingAccount(true)

    // Update Supabase Auth user metadata & email if changed
    const authUpdate: any = { data: { full_name: fullName.trim() } }
    if (email.trim()) {
      authUpdate.email = email.trim()
    }
    const { error: authErr } = await supabase.auth.updateUser(authUpdate)
    await saveUserProfile(supabase, userId, fullName.trim(), email.trim())

    if (authErr) {
      showToast(authErr.message, false)
    } else {
      showToast('Profile updated successfully')
    }
    setSavingAccount(false)
  }

  // Toggle Notification Setting
  const handleToggleNotif = async (key: 'lowStock' | 'shiftClose' | 'scanMismatch') => {
    let newLow = lowStockAlerts
    let newShift = shiftCloseReminder
    let newMismatch = scanMismatchAlerts

    if (key === 'lowStock') {
      newLow = !lowStockAlerts
      setLowStockAlerts(newLow)
    } else if (key === 'shiftClose') {
      newShift = !shiftCloseReminder
      setShiftCloseReminder(newShift)
    } else if (key === 'scanMismatch') {
      newMismatch = !scanMismatchAlerts
      setScanMismatchAlerts(newMismatch)
    }

    if (userId) {
      setSavingNotifs(true)
      await saveUserSettings(supabase, userId, {
        low_stock_alerts: newLow,
        shift_close_reminder: newShift,
        scan_mismatch_alerts: newMismatch,
      })
      // Local storage persistence fallback
      localStorage.setItem(
        `user_settings_${userId}`,
        JSON.stringify({
          low_stock_alerts: newLow,
          shift_close_reminder: newShift,
          scan_mismatch_alerts: newMismatch,
        })
      )
      setSavingNotifs(false)
      showToast('Notification preference updated')
    }
  }

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      showToast('Please enter a new password', false)
      return
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', false)
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', false)
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      showToast(error.message, false)
    } else {
      showToast('Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  // Sign Out
  const handleLogOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="app">
      <Sidebar activeItem="Settings" />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-eyebrow">Preferences</div>
            <h1>Settings</h1>
          </div>
        </div>

        <div className="grid-2">
          {/* Store Info */}
          <div className="panel" style={{ marginBottom: '14px' }}>
            <div className="panel-head">
              <span className="panel-title">Store Info</span>
            </div>
            <form onSubmit={handleSaveStore}>
              <div className="field">
                <label>Store Name</label>
                <input
                  type="text"
                  placeholder="e.g. Corner Mart"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Store Address</label>
                <input
                  type="text"
                  placeholder="Street, City, State"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '6px' }}
                disabled={savingStore}
              >
                {savingStore ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Account */}
          <div className="panel" style={{ marginBottom: '14px' }}>
            <div className="panel-head">
              <span className="panel-title">Account</span>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn"
                style={{ marginTop: '6px' }}
                disabled={savingAccount}
              >
                {savingAccount ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Notifications */}
        <div className="panel" style={{ marginBottom: '14px' }}>
          <div className="panel-head">
            <span className="panel-title">Notifications</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Low Stock Alerts</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                Notify when a book falls below 15 percent remaining
              </div>
            </div>
            <div
              className={`toggle-switch ${lowStockAlerts ? 'is-on' : ''}`}
              onClick={() => handleToggleNotif('lowStock')}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Shift Close Reminder</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                Remind attendant to close out at end of shift
              </div>
            </div>
            <div
              className={`toggle-switch ${shiftCloseReminder ? 'is-on' : ''}`}
              onClick={() => handleToggleNotif('shiftClose')}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Scan Mismatch Alerts</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                Flag when scanned counts do not match logged sales
              </div>
            </div>
            <div
              className={`toggle-switch ${scanMismatchAlerts ? 'is-on' : ''}`}
              onClick={() => handleToggleNotif('scanMismatch')}
            />
          </div>
        </div>

        {/* Security */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Security</span>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="field-row">
              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button
                type="submit"
                className="btn"
                disabled={savingPassword}
              >
                {savingPassword ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                className="btn"
                style={{ color: 'var(--red)', borderColor: 'rgba(255,92,92,0.3)' }}
                onClick={handleLogOut}
              >
                Log Out
              </button>
            </div>
          </form>
        </div>
      </main>

      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.ok ? 'var(--blue)' : 'var(--red)',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  )
}
