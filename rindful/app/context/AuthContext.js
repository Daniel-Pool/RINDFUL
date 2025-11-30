//Referenced: https://www.youtube.com/watch?v=S_sV6bYWKXQ 

'use client';
import { useContext, createContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";

// Create the authentication context
const AuthContext = createContext();

// Provider component that wraps the app and provides auth context to all children
export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // Sign in with Google using a popup
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  // Sign out the current user
  const logOut = () => {
    signOut(auth);
  };

  // Update States after Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);    
    }, (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  // Provide auth context to all child components
  return (
    <AuthContext.Provider value={{ user, googleSignIn, logOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};


export const UserAuth = () => {
  return useContext(AuthContext);
};