import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Leads',
    default: 'Leads',
  },
};

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

