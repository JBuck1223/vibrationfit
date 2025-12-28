import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Initial',
};

export default function InitialAnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

