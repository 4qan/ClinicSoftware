import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/auth/AuthProvider'

interface Props {
  children: React.ReactNode
  allowedRoles: Array<'doctor' | 'nurse'>
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { role } = useAuthContext()
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
