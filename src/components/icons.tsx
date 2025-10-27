import {type LucideProps, TrendingUp} from 'lucide-react';

export const Icons = {
  Logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s1.5-2 5-2 5 2 5 2-1.5 2-5 2-5-2-5-2z" />
      <path d="M12 12s1.5-2 5-2 5 2 5 2-1.5 2-5 2-5-2-5-2z" />
      <path d="M2 12h20" />
    </svg>
  ),
  TrendingUp: TrendingUp,
};
