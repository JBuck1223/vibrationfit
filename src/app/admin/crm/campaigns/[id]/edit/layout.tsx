import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit',
};

export default function EditCampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

