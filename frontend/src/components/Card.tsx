import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "flat";
  title?: string;
};

export default function Card({
  variant = "default",
  title,
  className = "",
  children,
  ...props
}: CardProps) {
  const base = "rounded-xl p-6";
  const variants = {
    default: "bg-white/5 border border-white/10",
    elevated: "bg-white/10 border border-white/20",
    flat: "bg-white/5",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {title && <h3 className="text-xl font-semibold text-pong-light mb-4">{title}</h3>}
      {children}
    </div>
  );
}
