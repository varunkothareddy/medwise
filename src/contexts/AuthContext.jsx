import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model);
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh({ $autoCancel: false });
          setCurrentUser(pb.authStore.model);
          setIsAuthenticated(true);
        } catch (error) {
          pb.authStore.clear();
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
      setInitialLoading(false);
    };

    checkAuth();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
      setIsAuthenticated(!!model);
    });

    return () => unsubscribe();
  }, []);

  const requestOTP = async (email) => {
    try {
      // Ensure user exists for OTP to send email
      try {
        const tempPassword = crypto.randomUUID();
        await pb.collection('users').create({
          email: email,
          password: tempPassword,
          passwordConfirm: tempPassword,
          mobileNumber: email.split('@')[0].replace(/[^0-9]/g, '').padEnd(10, '0').slice(0, 10) // Mock mobile for schema
        }, { $autoCancel: false });
      } catch (e) {
        // User likely exists, proceed
      }
      
      const result = await pb.collection('users').requestOTP(email, { $autoCancel: false });
      return result.otpId;
    } catch (error) {
      console.error("OTP Request Error:", error);
      toast.error("Failed to send OTP. Please try again.");
      throw error;
    }
  };

  const authWithOTP = async (otpId, code) => {
    try {
      const authData = await pb.collection('users').authWithOTP(otpId, code, { $autoCancel: false });
      setCurrentUser(authData.record);
      setIsAuthenticated(true);
      return authData;
    } catch (error) {
      console.error("OTP Verification Error:", error);
      toast.error("Invalid OTP code.");
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  const value = {
    currentUser,
    isAuthenticated,
    requestOTP,
    authWithOTP,
    logout,
    initialLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!initialLoading && children}
    </AuthContext.Provider>
  );
};