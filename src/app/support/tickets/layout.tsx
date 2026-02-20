import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Support',
    default: 'Support Tickets',
  },
};

export default function SupportTicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
