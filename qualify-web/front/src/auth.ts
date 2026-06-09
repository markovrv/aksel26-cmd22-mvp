import { useEffect, useState } from 'react';

import { DEMO_USERS, type DemoUser } from './data/users';

const STORAGE_KEY = 'qualify.currentUser';
const AUTH_EVENT = 'qualify-auth-change';

type PublicUser = Omit<DemoUser, 'password'>;

function toPublicUser(user: DemoUser): PublicUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

export function getCurrentUser(): PublicUser | null {
  const savedUser = localStorage.getItem(STORAGE_KEY);
  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as PublicUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function login(loginValue: string, password: string): PublicUser | null {
  const user = DEMO_USERS.find((item) => item.login === loginValue.trim() && item.password === password);
  if (!user) {
    return null;
  }

  const publicUser = toPublicUser(user);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(publicUser));
  window.dispatchEvent(new Event(AUTH_EVENT));
  return publicUser;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function useCurrentUser() {
  const [user, setUser] = useState<PublicUser | null>(() => getCurrentUser());

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser());

    window.addEventListener('storage', syncUser);
    window.addEventListener(AUTH_EVENT, syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener(AUTH_EVENT, syncUser);
    };
  }, []);

  return user;
}
