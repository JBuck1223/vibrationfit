import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Analyze',
    default: 'Analyze',
  },
};

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

