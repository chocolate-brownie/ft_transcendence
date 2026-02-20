import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps routes that require the user to be logged in.
// While the session check is in progress → render nothing (avoids flash redirect).
// Not logged in → redirect to /login.
// Logged in → render the page normally.

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
