import { Navigate, Outlet } from "react-router-dom";
import {
  getDashboardPathByRole,
  getStoredUser,
  getToken,
} from "../services/authService";

function ProtectedRoute({ allowedRole }) {
  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  if (allowedRole && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
