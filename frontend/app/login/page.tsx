"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (e: any) {
      const text = typeof e?.message === 'string' ? e.message : '';
      let msg = 'Login failed';
      try {
        const parsed = JSON.parse(text);
        if (parsed?.message) msg = parsed.message;
      } catch {
        if (text) msg = text;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gradient-to-b from-[#f9fafb] to-white">
        <div className="w-full max-w-md text-neutral-900">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Welcome Back 👋</h1>
            <p className="opacity-70">Login to continue to Smart Society OS</p>
          </div>

          <form
            onSubmit={onSubmit}
            className={`rounded-xl border border-neutral-200 bg-white shadow-sm p-6 space-y-4 transition-all ${loading ? 'opacity-80' : ''}`}
          >
            <div className="space-y-1">
              <label className="text-sm opacity-80">Email</label>
              <input
                className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:outline-none focus:border-neutral-400 text-neutral-900 placeholder:text-neutral-400"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm opacity-80">Password</label>
              <input
                className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:outline-none focus:border-neutral-400 text-neutral-900 placeholder:text-neutral-400"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-orange-500"
                />
                <span className="opacity-80">Remember me</span>
              </label>
              <a className="opacity-80 hover:opacity-100 cursor-pointer">Forgot Password?</a>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              className="w-full px-4 py-2 rounded-md text-black font-medium bg-gradient-to-r from-[#F97316] to-[#F59E0B] hover:opacity-95 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center text-sm opacity-80">
              Don&apos;t have an account? <a className="text-orange-600 hover:text-orange-500 cursor-pointer">Create Account</a>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full md:w-1/2 relative hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#9333ea] to-[#f59e0b]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
        <div className="relative h-full min-h-[50vh] flex items-center justify-center p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/loginpage.png"
            alt="Building"
            className="w-4/5 max-w-[520px] h-auto rounded-lg shadow-2xl ring-1 ring-white/20 animate-[float_6s_ease-in-out_infinite]"
          />
        </div>
        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
