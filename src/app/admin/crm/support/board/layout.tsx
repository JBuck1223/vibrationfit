import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Board',
};

export default function SupportBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

