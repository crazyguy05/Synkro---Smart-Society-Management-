import RoleGuard from '../../components/RoleGuard';

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['guard']}>{children}</RoleGuard>;
}
