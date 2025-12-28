import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Board',
};

export default function MembersBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

