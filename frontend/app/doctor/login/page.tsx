'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function DoctorLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');

      const response = await authApi.doctorLogin(data);

      if (response.success && response.data) {
        const { token, doctor } = response.data;
        if (token && doctor) {
          setAuth(token, doctor, 'DOCTOR');
          router.push('/doctor/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-cosmic relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-teal-600/20"></div>
        <div className="relative z-10 max-w-lg text-white">
          <div className="mb-8">
            <div className="text-4xl font-black mb-2 text-white uppercase tracking-tight">BHISHAK MED</div>
            <p className="text-lg font-semibold text-white/90">Indian Telemedicine</p>
            <div className="h-1 w-24 bg-gradient-to-r from-amber-400 to-orange-400 rounded mt-3"></div>
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">
            Welcome back, Doctor
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Connecting You to Care, Anytime, Anywhere.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Secure & encrypted platform</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">HD video consultations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="mb-8 lg:hidden">
            <div className="text-3xl font-bold text-gradient uppercase mb-1">BHISHAK MED</div>
            <p className="text-slate-600 font-semibold">Indian Telemedicine</p>
          </div>

          <div className="card-elevated p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Sign in to your account
              </h2>
              <p className="text-slate-600">
                Enter your credentials to continue
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="input-elevated w-full"
                    placeholder="doctor@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    id="password"
                    className="input-elevated w-full"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-modern btn-cosmic py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
              </div>

              <div className="text-center pt-4">
                <p className="text-slate-600">
                  Don't have an account?{' '}
                  <a href="/doctor/signup" className="text-violet-600 hover:text-violet-700 font-semibold">
                    Register here
                  </a>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="text-slate-500 hover:text-slate-700 text-sm font-medium">
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
