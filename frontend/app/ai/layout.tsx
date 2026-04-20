import RoleGuard from '../../components/RoleGuard';

export default function AILayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['admin', 'resident']}>{children}</RoleGuard>;
}
