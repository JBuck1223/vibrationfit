import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Queue',
    default: 'Queue',
  },
};

export default function QueueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

