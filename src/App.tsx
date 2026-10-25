import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initializeTheme } from './store';
import { useAuthStore } from './store/authStore';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useSessionRefresh(isAuthenticated);

  useEffect(() => {
    initializeTheme();
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
