import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Admin',
    default: 'Admin',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

