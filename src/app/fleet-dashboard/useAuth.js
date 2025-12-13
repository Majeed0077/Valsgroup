// src/app/fleet-dashboard/useAuth.js
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AUTH_ROUTES = new Set(['/login', '/signup', '/forgot-password']);

function readAuthFlag() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  } catch {
    return false;
  }
}

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(readAuthFlag());
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const loggedIn = readAuthFlag();
    setIsAuthenticated(loggedIn);
    setAuthChecked(true);

    // If not logged in and trying to access protected route -> redirect to login
    if (!loggedIn && !AUTH_ROUTES.has(pathname)) {
      router.replace('/login');
      return;
    }

    // If logged in and user is on auth page -> push dashboard (optional)
    if (loggedIn && AUTH_ROUTES.has(pathname)) {
      router.replace('/fleet-dashboard');
    }
  }, [pathname, router]);

  return { authChecked, isAuthenticated };
}
