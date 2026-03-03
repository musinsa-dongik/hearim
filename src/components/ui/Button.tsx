/**
 * 공통 Button 컴포넌트
 * variant: primary(기본 액션) / secondary(보조) / ghost(텍스트만)
 */
import { type ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-hearim-primary text-hearim-bg hover:opacity-80",
  secondary:
    "border border-hearim-border text-hearim-text hover:bg-hearim-border/30",
  ghost:
    "text-hearim-muted hover:text-hearim-text hover:bg-hearim-border/20",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
