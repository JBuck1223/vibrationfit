import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Account',
    default: 'Account',
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

