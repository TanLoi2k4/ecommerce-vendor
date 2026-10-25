import { AUTH_TOKEN_KEY, getAuthItem } from './authStorage';

interface KeycloakRealmAccess {
  roles?: string[];
}

export interface TokenClaims {
  /** Keycloak subject — use as userKeycloakId in chat APIs */
  sub: string;
  preferredUsername?: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  name?: string;
  realmRoles: string[];
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return getAuthItem(AUTH_TOKEN_KEY);
}

export function parseTokenClaims(token?: string | null): TokenClaims | null {
  const value = token ?? getAuthToken();
  if (!value) return null;

  const payload = decodeJwtPayload(value);
  if (!payload || typeof payload.sub !== 'string') return null;

  const realmAccess = payload.realm_access as KeycloakRealmAccess | undefined;

  return {
    sub: payload.sub,
    preferredUsername:
      typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    givenName: typeof payload.given_name === 'string' ? payload.given_name : undefined,
    familyName: typeof payload.family_name === 'string' ? payload.family_name : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    realmRoles: realmAccess?.roles ?? [],
  };
}

/** Returns Keycloak `sub` claim — matches chat senderKeycloakId / userKeycloakId. */
export function getUserIdFromToken(): string | null {
  return parseTokenClaims()?.sub ?? null;
}

export function hasVendorRole(): boolean {
  const roles = parseTokenClaims()?.realmRoles ?? [];
  return roles.includes('VENDOR') || roles.includes('ROLE_VENDOR');
}

export function isTokenExpired(token?: string | null): boolean {
  const value = token ?? getAuthToken();
  if (!value) return true;
  const payload = decodeJwtPayload(value);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now();
}
