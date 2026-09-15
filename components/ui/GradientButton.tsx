import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function GradientButton({ fullWidth, className = "", children, ...rest }: Props) {
  return (
    <button
      className={`btn-gradient-brand px-6 py-3 text-sm shadow-soft disabled:shadow-none ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
