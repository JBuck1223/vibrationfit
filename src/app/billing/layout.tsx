import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing',
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Standalone pages: the shell remaps their old flat panels to glass.
  return <div className="contents" data-studio-glass>{children}</div>;
}

