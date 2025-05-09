import React from "react";
import { cn } from "@/lib/utils";
import LoadingSpinner from "./LoadingSpinner";

export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: "xs" | "sm" | "md" | "lg" | "xl";
  spinnerColor?:
    | "primary"
    | "secondary"
    | "white"
    | "dark"
    | "success"
    | "danger"
    | "warning";
  text?: string;
  blur?: boolean;
  fullScreen?: boolean;
}

export default function LoadingOverlay({
  isLoading,
  children,
  className,
  spinnerSize = "md",
  spinnerColor = "primary",
  text,
  blur = true,
  fullScreen = false,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}

      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center z-10",
            blur && "backdrop-blur-sm",
            fullScreen ? "fixed z-50" : "",
            spinnerColor === "white" ? "bg-black/40" : "bg-white/60",
          )}
        >
          <LoadingSpinner size={spinnerSize} color={spinnerColor} text={text} />
        </div>
      )}
    </div>
  );
}
