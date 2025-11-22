"use client";
import Shell from '../../components/Shell';
import PanicButton from '../../components/PanicButton';
import { useAuth } from '../../lib/auth';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <Shell>
      <div className="grid gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Welcome{user ? `, ${user.name}` : ''}</h2>
              <p className="opacity-80 text-sm">Role: {user?.role ?? 'guest'}</p>
            </div>
            <PanicButton />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4"><h3 className="font-medium">Notices</h3><p className="opacity-75 text-sm">Latest society updates.</p></div>
          <div className="card p-4"><h3 className="font-medium">Bills</h3><p className="opacity-75 text-sm">Your monthly dues.</p></div>
          <div className="card p-4"><h3 className="font-medium">Leaderboard</h3><p className="opacity-75 text-sm">Top contributors.</p></div>
        </div>
      </div>
    </Shell>
  );
}
