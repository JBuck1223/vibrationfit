import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Voice Profile',
    default: 'Voice Profile',
  },
};

export default function VoiceProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

