/**
 * 공통 Badge 컴포넌트
 * variant: default / success / warning
 */

const variants = {
  default: "bg-hearim-border/40 text-hearim-text",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
} as const;

type BadgeProps = {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
};

export default function Badge({
  variant = "default",
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
