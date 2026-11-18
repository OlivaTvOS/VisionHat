import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function RequireAuth() {
  const location = useLocation()
  const idUsuario = Number(sessionStorage.getItem('visionhat-user-id'))
  const autenticado = sessionStorage.getItem('visionhat-auth') === 'true' && Number.isInteger(idUsuario) && idUsuario > 0

  return autenticado
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
