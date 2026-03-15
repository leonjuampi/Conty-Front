
import { useState, useEffect } from 'react';
import { mockUsers, User } from '../mocks/users';

const AUTH_KEY = 'pizzeria_auth';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = (username: string, password: string): boolean => {
    const user = mockUsers.find(
      u => u.username === username && u.password === password
    );
    if (user) {
      const { password: _, ...safeUser } = user;
      const userToStore = { ...user };
      localStorage.setItem(AUTH_KEY, JSON.stringify(userToStore));
      setCurrentUser(userToStore);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
  };

  return { currentUser, login, logout };
}
