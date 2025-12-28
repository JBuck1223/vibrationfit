import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Single',
};

export default function SingleGenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

