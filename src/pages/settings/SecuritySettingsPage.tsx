import { Navigate, useSearchParams } from 'react-router-dom';

/** @deprecated Use /settings/account?tab=security */
export function SecuritySettingsPage() {
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams(searchParams);
  next.set('tab', 'security');
  return <Navigate to={`/settings/account?${next.toString()}`} replace />;
}
