'use client';
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'; 
import { useAuthStore, UserType } from '@/context/authStore';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '@/constant/constants';

const queryClient = new QueryClient();

export default function Navbar() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavbarContent />
    </QueryClientProvider>
  );
}

function NavbarContent() {
  const { setIsLoggedIn } = useAuthStore();
  const router = useRouter();
  const [user, setUser] = useState<UserType|null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user-storage');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser.state.user);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not found');
      const res = await fetch(`${BASE_URL}/auth/sign_out`, {
        method: 'DELETE',
        headers:{
          'Content-Type':'application/json',
          'uid':user.uid,
          'client':user.client,
          'access-token':user.accessToken,
        },
      });
      if (!res.ok) {
        throw new Error('Logout failed');
      }
      return res.text();
    },
    onSuccess: () => {
      setIsLoggedIn(false);
      localStorage.removeItem('user-storage');
      localStorage.removeItem('group-storage');
      localStorage.removeItem('template_user_is_logged_in');
      router.push('/');
    },
    onError: (error: any) => {
      console.error('Logout error:', error.message);
    },
  });

  const handleSignout = () => {
    if (user) {
      mutation.mutate();
    } else {
      console.error('User not found, cannot log out');
    }
  };

  return (
    <div>
      <div className="navbar bg-navbar text-primary sm:hidden">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl text-primary" href='/home'>GRUDU LIST</a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-2">
            <li>
              <a onClick={() => router.push('/group/create')} className="cursor-pointer text-primary">
                Create Group
              </a>
            </li>
            <li className="hidden sm:block">
              <a onClick={() => router.push('/group')} className="text-primary">
                My Groups
              </a>
            </li>
            <li>
              <details>
                <summary className="text-primary">More</summary>
                <ul className="bg-yellow-400 rounded-t-none p-2">
                  <li><a className="text-primary">Profile</a></li>
                  <li className="sm:hidden">
                    <a onClick={() => router.push('/group')} className="text-primary">
                      My Groups
                    </a>
                  </li>
                  <li>
                    <a onClick={handleSignout} className="cursor-pointer text-primary">
                      Logout
                    </a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
        {mutation.isPending && <p className="text-primary">Logging out...</p>}
        {mutation.isError && <p className="text-primary">Error: {mutation.error?.message}</p>}
      </div>
  
      {/* Sidebar */}
      <div className="hidden sm:flex sm:flex-col sm:w-full sm:h-screen bg-navbar text-primary">
        <div className="p-4">
          <a className="text-2xl font-bold block mb-6 text-primary" href='/home'>
            GRUDU LIST
          </a>
          <hr className="border-t-2 border-gray-800 mb-4" />
        </div>
        <ul className="menu flex flex-col space-y-4 px-4">
          <li>
            <a onClick={() => router.push('/group/create')} className="cursor-pointer text-primary">
              Create Group
            </a>
          </li>
          <li>
            <a onClick={() => router.push('/group')} className="text-primary">
              My Groups
            </a>
          </li>
          <li>
            <a className="cursor-pointer text-primary">Profile</a>
          </li>
          <li>
            <a onClick={handleSignout} className="cursor-pointer text-primary">
              Logout
            </a>
          </li>
        </ul>
        {mutation.isPending && <p className="p-4 text-primary">Logging out...</p>}
        {mutation.isError && <p className="p-4 text-red-500">Error: {mutation.error?.message}</p>}
      </div>
    </div>
  );
  
}
