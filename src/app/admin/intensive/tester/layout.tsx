import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intensive Tester | Admin',
  description: 'Test and advance intensive users through steps',
};

export default function IntensiveTesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
