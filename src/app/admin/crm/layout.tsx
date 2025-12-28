import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | CRM',
    default: 'CRM',
  },
};

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

