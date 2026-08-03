"use client";

import { useEffect, useState } from "react";
import { getBadgeData, type BadgeData } from "@/lib/actions/badge";

interface BadgeProps {
  refreshKey?: number;
}

export default function Badge({ refreshKey }: BadgeProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [data, setData] = useState<BadgeData | null>(null);

  useEffect(() => {
    fetch("/badge.svg")
      .then((r) => r.text())
      .then(setSvg);
  }, []);

  useEffect(() => {
    getBadgeData().then(setData);
  }, [refreshKey]);

  if (!svg || !data) return null;

  let filled = svg;

  filled = filled.replace("{{FIRSTNAME}}", (data.firstName || "NAME").toUpperCase());
  filled = filled.replace("{{OVERALL}}", String(data.overall ?? 0));
  filled = filled.replace("{{POSITION}}", (data.position || "PRO").toUpperCase());
  filled = filled.replace("{{FLAG}}", data.flag || "");
  filled = filled.replace("{{PHOTO}}", data.photo || "");

  const statMap: Record<string, number> = {
    PROJ: data.proj ?? 0,
    TECH: data.tech ?? 0,
    CONT: data.cont ?? 0,
    YEXP: data.yexp ?? 0,
    CERT: data.cert ?? 0,
    LANG: data.lang ?? 0,
  };

  Object.entries(statMap).forEach(([label, value]) => {
    filled = filled.replace(`{{${label}}}`, String(value));
  });

  return (
    <div
      className="w-full max-w-[384px]"
      dangerouslySetInnerHTML={{ __html: filled }}
    />
  );
}
