import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Paper',
};

export default function DailyPaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

