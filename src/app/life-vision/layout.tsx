import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Life Vision',
    default: 'Life Vision',
  },
};

export default function LifeVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

