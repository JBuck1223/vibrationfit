import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VIVA',
};

export default function VivaRefineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

