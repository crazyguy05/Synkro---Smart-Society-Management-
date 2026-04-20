import RoleGuard from '../../components/RoleGuard';

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['resident']}>{children}</RoleGuard>;
}
