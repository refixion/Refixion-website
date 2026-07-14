import React from "react";

/**
 * Refixion brand logo. Two variants:
 *   <LogoMark /> — just the phone-with-bolt mark (icon size)
 *   <LogoFull /> — full mark + wordmark
 */
export function LogoMark({ className = "", size = 32 }) {
  return (
    <img
      src="/brand/refixion-mark.png"
      alt="Refixion"
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function LogoFull({ className = "", height = 28 }) {
  return (
    <img
      src="/brand/refixion-logo.png"
      alt="Refixion"
      className={`inline-block object-contain ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
