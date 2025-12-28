import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Household',
    default: 'Household',
  },
};

export default function HouseholdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

