import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Imagination',
};

export default function ImaginationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

