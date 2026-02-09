import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Storage History',
};

export default function StorageHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
