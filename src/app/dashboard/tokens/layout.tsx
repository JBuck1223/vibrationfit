import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tokens',
};

export default function TokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

