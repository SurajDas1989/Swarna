import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your Swarna account to view orders and manage your profile.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
