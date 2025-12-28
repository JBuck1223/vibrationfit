import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Abundance Tracker',
};

export default function AbundanceTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

