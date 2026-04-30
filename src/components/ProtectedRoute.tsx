import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/auth/AuthProvider'
import { getDeploymentMode } from '@/db/localSettings'

interface Props {
  children: React.ReactNode
  allowedRoles?: Array<'doctor' | 'nurse'>
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  // W8: always call the hook at the top -- rules-of-hooks safe, no lint
  // disables, no two-form ambiguity. Single source of truth.
  const { isAuthenticated, role } = useAuthContext()

  // Auth check first: an unauthenticated user must be redirected even in solo
  // mode. SPEC req 5 grants solo authenticated routes; it does not grant
  // unauthenticated access.
  if (!isAuthenticated) return <Navigate to="/" replace />

  // D-14: in solo mode there is exactly one user (the doctor); all routes
  // accessible to authenticated users. Skip the role check entirely.
  if (getDeploymentMode() === 'solo') return <>{children}</>

  // Networked mode: enforce allowedRoles when provided.
  // Defense in depth (Phase 22 behavior preserved): a role-gated route with a
  // null role redirects rather than rendering. useCouchAuth couples role with
  // isAuthenticated, so this branch is "shouldn't happen", but we redirect
  // rather than rely on that invariant.
  if (allowedRoles && !role) return <Navigate to="/" replace />
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
