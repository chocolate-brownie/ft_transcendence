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
    default: "bg-white/30 backdrop-blur-xl border border-black/10",
    elevated: "bg-white/30 backdrop-blur-xl border border-black/10 shadow-sm",
    flat: "bg-white/30 backdrop-blur-xl",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {title && <h3 className="text-xl font-semibold text-pong-text mb-4">{title}</h3>}
      {children}
    </div>
  );
}
