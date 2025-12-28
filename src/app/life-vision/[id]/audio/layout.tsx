import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Audio',
    default: 'Audio',
  },
};

export default function AudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

