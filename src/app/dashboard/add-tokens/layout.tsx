import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Tokens',
};

export default function AddTokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

