import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Support',
    default: 'Support',
  },
};

export default function DashboardSupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

