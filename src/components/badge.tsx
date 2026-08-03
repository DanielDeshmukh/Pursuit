"use client";

import { useEffect, useState } from "react";

interface BadgeProps {
  photo: string | null;
  name: string;
  initials: string;
  overall: number;
  position: string;
  flag: string;
  stats: { label: string; value: string | number }[];
}

export default function Badge({
  photo,
  name,
  initials,
  overall,
  position,
  flag,
  stats,
}: BadgeProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/badge.svg")
      .then((r) => r.text())
      .then(setSvg);
  }, []);

  if (!svg) return null;

  const left = stats.slice(0, 3);
  const right = stats.slice(3, 6);

  let filled = svg;

  // Replace template variables
  filled = filled.replace("{{FIRSTNAME}}", name.toUpperCase());
  filled = filled.replace("{{OVERALL}}", String(overall));
  filled = filled.replace("{{POSITION}}", position.toUpperCase());
  filled = filled.replace("{{FLAG}}", flag);
  filled = filled.replace("{{PHOTO}}", photo || "");

  // Replace stat values
  const labels = ["PROJ", "TECH", "CONT", "YEXP", "CERT", "LANG"];
  const values = [...left, ...right];
  labels.forEach((label, i) => {
    filled = filled.replace(`{{${label}}}`, String(values[i]?.value ?? ""));
  });

  return (
    <div
      className="w-full max-w-[384px]"
      dangerouslySetInnerHTML={{ __html: filled }}
    />
  );
}
