import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hh_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('hh_user');
      }
    }
    setInitialLoading(false);
  }, []);

  const loginWithMobile = (mobile) => {
    const user = { mobile, email: `${mobile}@patient.healthhorizon` };
    localStorage.setItem('hh_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('hh_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  const value = {
    currentUser,
    isAuthenticated,
    loginWithMobile,
    logout,
    initialLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!initialLoading && children}
    </AuthContext.Provider>
  );
};