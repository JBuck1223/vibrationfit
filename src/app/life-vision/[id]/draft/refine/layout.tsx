import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refine',
};

export default function DraftRefineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

