import { ReactNode } from "react";
import Button from "../Button";
import Card from "../Card";

type GameModeColor = "blue" | "green" | "neutral";

interface GameModeCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: GameModeColor;
  badgeText?: string;
  className?: string;
  children?: ReactNode;
}

export default function GameModeCard({
  imageSrc,
  imageAlt,
  title,
  description,
  buttonText,
  onClick,
  loading = false,
  disabled = false,
  color = "blue",
  badgeText,
  className = "",
  children,
}: GameModeCardProps) {
  const colorClassMap: Record<GameModeColor, string> = {
    blue: "border border-pong-accent/30",
    green: "border border-pong-secondary/35",
    neutral: "border border-black/10",
  };

  const accentBarMap: Record<GameModeColor, string> = {
    blue: "bg-pong-accent",
    green: "bg-pong-secondary",
    neutral: "bg-shadow-grey-300",
  };

  const imageBgMap: Record<GameModeColor, string> = {
    blue: "bg-carrot-orange-50/60",
    green: "bg-lime-moss-50/60",
    neutral: "bg-shadow-grey-50/60",
  };

  const hoverShadowMap: Record<GameModeColor, string> = {
    blue: "hover:shadow-[0_12px_40px_rgba(240,139,15,0.15)]",
    green: "hover:shadow-[0_12px_40px_rgba(117,153,51,0.15)]",
    neutral: "hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
  };

  const buttonVariant: "primary" | "lime" | "secondary" =
    color === "green" ? "lime" : color === "neutral" ? "secondary" : "primary";

  return (
    <Card
      variant="elevated"
      className={`relative overflow-hidden group flex min-h-[430px] h-full flex-col items-center gap-5 text-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ${hoverShadowMap[color]} ${colorClassMap[color]} ${className}`}
    >
      <div className={`absolute top-0 left-0 h-1 w-full ${accentBarMap[color]}`} />

      {badgeText ? (
        <span className="absolute top-4 right-4 rounded-full bg-black/10 border border-black/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-pong-text/50">
          {badgeText}
        </span>
      ) : null}

      <div className={`mx-auto flex h-44 w-full items-center justify-center rounded-2xl ${imageBgMap[color]}`}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-contain p-3"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-pong-text">{title}</h2>
        <p className="text-sm text-pong-text/70">{description}</p>
      </div>

      <div className="mt-auto w-full space-y-3">
        {children}
        <Button
          variant={buttonVariant}
          className="w-full"
          onClick={onClick}
          disabled={disabled || loading}
        >
          {loading ? "Loading..." : buttonText}
        </Button>
      </div>
    </Card>
  );
}
