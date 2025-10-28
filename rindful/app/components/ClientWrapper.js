'use client';
import Navbar from "./Navbar";
import {AuthContextProvider} from '../context/AuthContext';

export default function ClientLayoutWrapper({ children }) {
  return (
    <AuthContextProvider>
        <Navbar />
      {children}
    </AuthContextProvider>
  );
}