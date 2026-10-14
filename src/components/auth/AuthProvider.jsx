import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  AUTH_CHANGED_EVENT, canAccessRoute, clearAuthSession, landingPage, readAuthSession,
} from '../../services/authSession.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readAuthSession)
  useEffect(() => {
    const sync = () => setSession(readAuthSession())
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  useEffect(() => {
    if (!session) return undefined
    const timer = window.setTimeout(clearAuthSession, Math.min(session.user.expiresAt - Date.now(), 2147483647))
    return () => window.clearTimeout(timer)
  }, [session])
  return <AuthContext.Provider value={{ session, user: session?.user || null, logout: clearAuthSession }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!canAccessRoute(user.role, location.pathname)) return <Navigate to={landingPage(user.role)} replace />
  return <Outlet />
}
