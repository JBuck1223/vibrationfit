import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vision Board',
};

export default function VisionBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

