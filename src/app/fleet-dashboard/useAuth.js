// src/app/fleet-dashboard/useAuth.js (or your actual path)
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname

export function useAuth() {
  // Attempt to initialize state from sessionStorage if available (client-side only)
  const getInitialAuth = () => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('isLoggedIn') === 'true';
      } catch (e) {
        console.error("[useAuth] Initial sessionStorage read error:", e);
        return false;
      }
    }
    return false; // Default if not in browser (e.g., during SSR build, though this is 'use client')
  };

  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuth());
  const [authChecked, setAuthChecked] = useState(false); // Start as false, true after first check
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    // console.log("[useAuth] useEffect running. Current pathname:", pathname);
    let loggedInStatus = false;
    try {
      loggedInStatus = sessionStorage.getItem('isLoggedIn') === 'true';
      // console.log("[useAuth] Read from sessionStorage, isLoggedIn:", loggedInStatus);
    } catch (e) {
      console.error("[useAuth] Session read error during effect:", e);
      // Decide on a safe default, e.g., treat as logged out on error
      loggedInStatus = false;
    }

    setIsAuthenticated(loggedInStatus);
    setAuthChecked(true); // Mark that the check has been performed

    if (!loggedInStatus && pathname !== '/login') {
      // console.warn("[useAuth] Not authenticated and not on login page. Redirecting to /login.");
      router.replace('/login');
    } else if (loggedInStatus) {
      // console.log("[useAuth] User is authenticated.");
    } else if (!loggedInStatus && pathname === '/login') {
      // console.log("[useAuth] Not authenticated, but already on login page. No redirect needed.");
    }

  // Key dependencies:
  // - pathname: Re-check auth if the route changes (e.g., user navigates away from login)
  // - router: If router instance itself could change (less common with App Router's useRouter)
  }, [pathname, router]); // Add pathname to re-evaluate if path changes

  // For debugging, you can log the returned values
  // useEffect(() => {
  //   console.log("[useAuth] Returning: authChecked:", authChecked, "isAuthenticated:", isAuthenticated);
  // }, [authChecked, isAuthenticated]);

  return { authChecked, isAuthenticated };
}