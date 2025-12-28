import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Generator',
};

export default function AudioGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

