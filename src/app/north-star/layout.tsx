import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'North Star',
};

export default function NorthStarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

