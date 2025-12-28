import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Assembly',
};

export default function AssemblyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

