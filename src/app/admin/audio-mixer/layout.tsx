import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Mixer',
};

export default function AudioMixerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

