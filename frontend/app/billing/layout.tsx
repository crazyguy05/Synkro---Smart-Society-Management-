import RoleGuard from '../../components/RoleGuard';

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['resident']}>{children}</RoleGuard>;
}
