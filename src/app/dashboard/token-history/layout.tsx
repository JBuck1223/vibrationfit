import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Token History',
};

export default function TokenHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

