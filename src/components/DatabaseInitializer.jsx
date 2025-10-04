'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
export default function DatabaseInitializer() {
  const checkAuth = useAuthStore((state) => state.checkAuth); 

  useEffect(() => {
    checkAuth(); 
  }, [checkAuth]);

  return null;
}