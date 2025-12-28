import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Token Usage',
};

export default function TokenUsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

