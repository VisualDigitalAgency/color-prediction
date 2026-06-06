/* Landing route `/` — renders the real unauthed marketing landing.
   `<Landing/>` is a `'use client'` component (router + AuthModal + live clock),
   so this page is a thin wrapper. The global AgeGate (blocking) and the visible
   landing disclaimer are handled inside the tree. */
import { Landing } from '@/components/landing';

export default function Home() {
  return <Landing />;
}
