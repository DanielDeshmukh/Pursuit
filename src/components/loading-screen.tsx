"use client";

import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % 4);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const quadrants = [
    { x: "left", y: "top" },
    { x: "right", y: "top" },
    { x: "right", y: "bottom" },
    { x: "left", y: "bottom" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas">
      <div className="relative h-40 w-40">
        {quadrants.map((q, i) => {
          const isActive = i === active;
          const x = q.x === "left" ? 0 : 1;
          const y = q.y === "top" ? 0 : 1;

          return (
            <div
              key={i}
              className="absolute transition-all duration-500 ease-in-out"
              style={{
                left: `${x * 52}%`,
                top: `${y * 52}%`,
                width: "48%",
                height: "48%",
                transform: isActive ? "scale(1.05)" : "scale(0.85)",
                opacity: isActive ? 1 : 0.5,
                zIndex: isActive ? 10 : 1,
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center gap-[15%] rounded-2xl bg-primary p-[18%] shadow-lg">
                <div className="flex w-full items-end justify-center gap-[12%]">
                  <div className="h-3 w-[35%] rounded-md border-[2.5px] border-white" />
                  <div className="h-5 w-[35%] rounded-md border-[2.5px] border-white" />
                </div>
                <div className="flex w-full items-start justify-center gap-[12%]">
                  <div className="h-5 w-[35%] rounded-md border-[2.5px] border-white" />
                  <div className="h-3 w-[35%] rounded-md border-[2.5px] border-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm font-medium tracking-wider text-charcoal">
        Loading...
      </p>
    </div>
  );
}
