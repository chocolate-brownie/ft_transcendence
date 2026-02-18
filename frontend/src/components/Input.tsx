//
import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-pong-light/60">{label}</label>}
      <input
        className={`bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-pong-light placeholder:text-pong-light/30 focus:outline-none focus:border-pong-accent ${className}`}
        {...props}
      />
    </div>
  );
}
