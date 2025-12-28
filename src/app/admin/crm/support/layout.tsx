import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Support',
    default: 'Support',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

