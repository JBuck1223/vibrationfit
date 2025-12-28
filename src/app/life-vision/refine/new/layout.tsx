import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New',
};

export default function NewRefinementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

