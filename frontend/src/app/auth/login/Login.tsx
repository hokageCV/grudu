'use client';
import { useAuthStore, useUserStore } from '@/context/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { BASE_URL } from '@/constant/constants';

const queryClient = new QueryClient();

export default function Login() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>
  );
}

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const setIsLoggedIn = useAuthStore((state) => state.setIsLoggedIn);
  const setUser = useUserStore((state) => state.setUser);

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (formData: { email: string; password: string }) => {
      const response = await fetch(`${BASE_URL}/auth/sign_in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const headers = response.headers;

      const client = headers.get('client') || '';
      const accessToken = headers.get('access-token') || '';
      const uid = headers.get('uid') || '';

      const data = await response.json();

      return { data, client, accessToken, uid };
    },
    onSuccess: ({ data, client, accessToken, uid }) => {
      setIsLoggedIn(true);
      setUser({
        name: data.data.name || 'Unknown',
        email: formData.email,
        id: data.data.id || 'Unknown',
        uid,
        client,
        accessToken,
      });

      router.push('/home');
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <section className="h-screen flex flex-col justify-center items-center">
      {mutation.isError && <p className="text-red-600 mb-4">{mutation.error?.message}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-80">
        <label className="input input-bordered flex items-center gap-2 w-full bg-white text-black">
          <EmailInputIcon />
          <input
            type="text"
            className="grow"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2 w-full bg-white text-black">
          <PasswordInputIcon />
          <input
            type="password"
            className="grow"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          />
        </label>

        <button 
          type="submit"
          className="btn w-full bg-navbar text-black hover:bg-yellow-400 transition duration-150"
        >
          Login
        </button>
        {mutation.isPending && <span className="loading loading-spinner"></span>}
      </form>
      <div className="divider w-36 mx-auto"></div>
      <div className="h-20 card rounded-box place-items-center">
        <p className="mt-2 text-center text-gray-600">
          Don't have an account?&nbsp;
          <Link
            href="/auth/signup"
            className="font-medium text-primary transition-all duration-200 hover:underline"
          >
            Signup
          </Link>
        </p>
      </div>
    </section>
  );
}

const EmailInputIcon = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 16 16'
      fill='currentColor'
      className='w-4 h-4 opacity-70'
    >
      <path d='M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z' />
      <path d='M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z' />
    </svg>
  );
};

const PasswordInputIcon = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 16 16'
      fill='currentColor'
      className='w-4 h-4 opacity-70'
    >
      <path
        fillRule='evenodd'
        d='M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z'
        clipRule='evenodd'
      />
    </svg>
  );
};
