import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      setIsAuthenticated(loggedIn);
      if (!loggedIn) router.replace('/login');
    } catch (e) {
      console.error("Session read error", e);
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  return { authChecked, isAuthenticated };
}
