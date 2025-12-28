import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'List',
};

export default function EmailListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

