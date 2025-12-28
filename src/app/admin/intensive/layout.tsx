import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Intensive',
    default: 'Intensive',
  },
};

export default function AdminIntensiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

