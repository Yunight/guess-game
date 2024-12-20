import { cn } from '@/lib/utils';

interface PokemonIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const PokemonIcon: React.FC<PokemonIconProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-6 h-6', className)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}; 