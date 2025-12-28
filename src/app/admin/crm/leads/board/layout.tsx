import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Board',
};

export default function LeadsBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

