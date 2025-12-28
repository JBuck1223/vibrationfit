import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refinements',
};

export default function RefinementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

