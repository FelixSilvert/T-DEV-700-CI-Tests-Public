import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full py-3 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyles =
    variant === "secondary"
      ? "bg-white text-blue-600 border border-blue-500 hover:bg-blue-50 focus:ring-blue-300"
      : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400";

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}
