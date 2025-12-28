import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Vibrational Event',
    default: 'Vibrational Event',
  },
};

export default function VibrationalEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

