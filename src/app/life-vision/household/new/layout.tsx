import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New',
};

export default function HouseholdNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

