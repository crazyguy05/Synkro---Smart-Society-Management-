import RoleGuard from '../../components/RoleGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['admin']}>{children}</RoleGuard>;
}
