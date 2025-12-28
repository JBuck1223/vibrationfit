import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule Call',
};

export default function ScheduleCallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

