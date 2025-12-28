import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intensive',
};

export default function IntensiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

