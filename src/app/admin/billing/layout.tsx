import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Cost Ledger',
};

export default function AdminBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
