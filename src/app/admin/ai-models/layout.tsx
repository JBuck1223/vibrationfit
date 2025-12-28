import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Models',
};

export default function AIModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

