import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | New',
    default: 'New',
  },
};

export default function NewVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

