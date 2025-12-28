import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test',
};

export default function EmailTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

