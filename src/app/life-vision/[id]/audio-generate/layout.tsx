import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Generate',
};

export default function AudioGenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

