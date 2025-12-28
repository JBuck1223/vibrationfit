import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Record',
};

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

