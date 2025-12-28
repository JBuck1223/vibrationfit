import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intensive Intake',
};

export default function IntensiveIntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

