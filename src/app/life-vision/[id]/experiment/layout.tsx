import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Experiment',
};

export default function ExperimentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

