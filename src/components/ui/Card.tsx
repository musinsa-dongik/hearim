/**
 * 공통 Card 컴포넌트
 * border + hover 효과가 있는 컨테이너
 */

type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export default function Card({ className = "", children }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-hearim-border p-4 transition-colors hover:bg-hearim-border/10 ${className}`}
    >
      {children}
    </div>
  );
}
