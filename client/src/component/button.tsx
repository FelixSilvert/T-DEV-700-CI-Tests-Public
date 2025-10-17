import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  colorVariant?: "blue" | "red" | "green" | "gray";
  className?: string;
  type?: "button" | "submit";
};

export default function Button({
  children,
  onClick,
  active = false,
  colorVariant = "blue",
  className = "",
  type = "button",
}: ButtonProps) {
  const colorClasses = {
    blue: active ? "bg-blue-600" : "bg-blue-500 hover:bg-blue-700",
    red: active ? "bg-red-600" : "bg-gray-400 hover:bg-red-700",
    green: active ? "bg-green-600" : "bg-gray-400 hover:bg-green-700",
    gray: active ? "bg-gray-500" : "bg-gray-400 hover:bg-gray-500",
  };


  return (
    <button
      type={type}
      onClick={onClick}
      className={`uppercase px-6 py-2 font-semibold rounded-lg text-white transition-all ${colorClasses[colorVariant]}${className}`}
    >
      {children}
    </button>
  );
}