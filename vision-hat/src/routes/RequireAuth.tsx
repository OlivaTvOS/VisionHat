import { Navigate, Outlet, useLocation } from 'react-router-dom'
export default function RequireAuth() { const location = useLocation(); return sessionStorage.getItem('visionhat-auth') === 'true' ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
