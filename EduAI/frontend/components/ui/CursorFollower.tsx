"use client";

import React, { useEffect, useState } from "react";

export function CursorFollower() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <>
      <div
        className="fixed pointer-events-none z-50 transition-transform duration-100 ease-out"
        style={{
          left: position.x - 20,
          top: position.y - 20,
          transform: isHovering ? "scale(1.5)" : "scale(1)",
        }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-xl" />
      </div>
      <div
        className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
        style={{
          left: position.x - 8,
          top: position.y - 8,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-white/50" />
      </div>
    </>
  );
}
