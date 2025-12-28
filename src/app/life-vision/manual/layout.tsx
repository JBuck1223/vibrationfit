import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manual',
};

export default function ManualVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

