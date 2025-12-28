import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio',
};

export default function LifeVisionAudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

