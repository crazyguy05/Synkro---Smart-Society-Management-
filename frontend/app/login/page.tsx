"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, Building2, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  // 3D tilt on the hero card
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 14 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 14 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseLeave = () => { mx.set(0); my.set(0); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials. Try the demo accounts on the right.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts: { role: string; email: string; tone: string }[] = [
    { role: 'Admin',    email: 'admin@example.com',    tone: 'from-brand-500 to-accent-violet' },
    { role: 'Resident', email: 'resident1@example.com', tone: 'from-accent-cyan to-brand-500' },
    { role: 'Guard',    email: 'guard@example.com',     tone: 'from-accent-emerald to-accent-cyan' },
    { role: 'Staff',    email: 'staff@example.com',     tone: 'from-accent-amber to-accent-rose' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* aurora + grid backdrop */}
      <div className="absolute inset-0 bg-aurora opacity-80 animate-gradient [background-size:200%_200%]" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg)]/80" />

      {/* floating orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-accent-violet/25 blur-3xl"
        animate={{ y: [0, -20, 0], x: [0, -10, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 right-1/3 h-60 w-60 rounded-full bg-accent-cyan/20 blur-3xl"
        animate={{ y: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* LEFT — 3D hero */}
        <div
          className="hidden lg:flex items-center justify-center p-10 [perspective:1400px]"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <motion.div
            style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}
            className="relative w-full max-w-md aspect-square"
          >
            {/* central 3D emblem */}
            <motion.div
              className="absolute inset-0 grid place-items-center"
              style={{ transform: 'translateZ(80px)' }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-500 to-accent-violet blur-2xl opacity-60 animate-pulse-glow" />
                <div className="relative h-40 w-40 rounded-[2rem] bg-gradient-to-br from-brand-400 via-brand-600 to-accent-violet grid place-items-center shadow-glow-lg ring-1 ring-white/20">
                  <Building2 size={64} className="text-white drop-shadow-lg" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>

            {/* orbiting icon tiles */}
            <FloatingTile
              position="top-0 left-6"     gradient="from-accent-cyan to-brand-500"
              z={120} delay={0.1} icon={<ShieldCheck size={28} className="text-white" />}
            />
            <FloatingTile
              position="top-8 right-0"    gradient="from-accent-violet to-accent-pink"
              z={140} delay={0.3} icon={<Sparkles size={28} className="text-white" />}
            />
            <FloatingTile
              position="bottom-6 left-0"  gradient="from-accent-emerald to-accent-cyan"
              z={110} delay={0.5} icon={<KeyRound size={28} className="text-white" />}
            />
            <FloatingTile
              position="bottom-0 right-8" gradient="from-accent-amber to-accent-rose"
              z={130} delay={0.7} icon={<Building2 size={28} className="text-white" />}
            />

            {/* orbit rings */}
            <div
              className="absolute inset-4 rounded-full border border-white/10"
              style={{ transform: 'translateZ(20px) rotateX(65deg)' }}
            />
            <div
              className="absolute inset-14 rounded-full border border-white/10"
              style={{ transform: 'translateZ(40px) rotateX(65deg)' }}
            />
          </motion.div>
        </div>

        {/* RIGHT — form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-2.5 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet grid place-items-center shadow-glow">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <div className="heading text-xl leading-tight">Synkro</div>
                <div className="text-[11px] text-muted tracking-wider uppercase">Smart Society OS</div>
              </div>
            </div>

            <h2 className="heading text-3xl mb-1">Welcome back</h2>
            <p className="text-sm text-muted mb-6">Sign in to manage your society.</p>

            <form onSubmit={onSubmit} className="glass p-6 space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@society.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                required
              />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text)]"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400"
                >
                  {error}
                </motion.div>
              )}

              <Button type="submit" loading={loading} leftIcon={<LogIn size={16} />} className="w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* demo accounts */}
            <div className="mt-6">
              <div className="text-xs text-muted mb-2 px-1">Try a demo account (password: <span className="font-mono text-brand-400">password</span>)</div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map(d => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => { setEmail(d.email); setPassword('password'); }}
                    className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-brand-500/40 hover:shadow-glow transition text-left"
                  >
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${d.tone} grid place-items-center text-white text-xs font-bold`}>
                      {d.role[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{d.role}</div>
                      <div className="text-[10px] text-muted truncate">{d.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FloatingTile({
  position,
  gradient,
  z,
  delay,
  icon,
}: {
  position: string;
  gradient: string;
  z: number;
  delay: number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      style={{ transform: `translateZ(${z}px)` }}
      className={`absolute ${position} animate-float-slow`}
    >
      <div className={`relative h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} grid place-items-center shadow-glow-lg ring-1 ring-white/20`}>
        {icon}
        <div className="absolute inset-0 rounded-2xl bg-white/10 blur-xl opacity-40 -z-10" />
      </div>
    </motion.div>
  );
}
