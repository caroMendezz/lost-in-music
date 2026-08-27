import React from "react";

export default function GlassPanel({ children, className = "", style = {} }) {
  return (
    <div className={`glass-panel ${className}`} style={style}>
      <span className="sheen" />
      {children}
    </div>
  );
}
