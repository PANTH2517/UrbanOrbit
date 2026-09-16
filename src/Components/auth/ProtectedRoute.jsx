import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { User } from "../../entities/User";

/**
 * Gate for routes that require a signed-in user with a particular role.
 * Roles come from Firebase custom claims (set only by Cloud Functions), never
 * from anything the client can set itself.
 */
export default function ProtectedRoute({ children, roles, redirectTo = "/GovernmentLogin" }) {
  const [status, setStatus] = useState("loading"); // 'loading' | 'allowed' | 'denied' | 'unauthenticated'

  useEffect(() => {
    let active = true;
    const unsubscribe = User.onChange((user) => {
      if (!active) return;
      if (!user) {
        setStatus("unauthenticated");
        return;
      }
      if (roles && roles.length > 0 && !roles.includes(user.role)) {
        setStatus("denied");
        return;
      }
      setStatus("allowed");
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [roles]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  if (status === "denied") {
    return <Navigate to="/GovernmentRegister" replace />;
  }

  return children;
}
