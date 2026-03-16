import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Sign up for a new Swarna account for a premium jewellery shopping experience.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
