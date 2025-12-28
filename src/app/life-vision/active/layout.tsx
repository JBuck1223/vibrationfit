import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Active',
};

export default function ActiveVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

