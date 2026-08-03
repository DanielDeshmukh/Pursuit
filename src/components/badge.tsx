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

  // Replace flag text element with image from flagsapi.com
  const flagTextMatch = filled.match(/<text[^>]*>\{\{FLAG\}\}<\/text>/);
  const flagRectMatch = filled.match(/<rect[^>]*x="74"[^>]*y="179"[^>]*\/>/);
  if (flagTextMatch && data.flag) {
    const tag = flagTextMatch[0];
    const xMatch = tag.match(/x="([^"]+)"/);
    const yMatch = tag.match(/y="([^"]+)"/);
    const x = xMatch ? parseFloat(xMatch[1]) : 92;
    const y = yMatch ? parseFloat(yMatch[1]) : 212;
    const code = data.flag.toUpperCase().trim();
    filled = filled.replace(tag, `<image x="${x - 22}" y="${y - 14}" width="44" height="44" href="https://flagsapi.com/${code}/flat/64.png" preserveAspectRatio="xMidYMid slice"/>`);
    // Remove the dark rect placeholder behind the flag
    if (flagRectMatch) {
      filled = filled.replace(flagRectMatch[0], "");
    }
  } else {
    filled = filled.replace("{{FLAG}}", data.flag || "");
  }

  // Replace photo placeholder block with actual image
  const photoBlock = filled.match(/<g clip-path="url\(#photoClip\)">[\s\S]*?<\/g>/)?.[0] || "";
  if (data.photo && photoBlock) {
    const photoReplacement = `<!-- Player photo -->
  <clipPath id="photoClip">
    <path d="M334.232 31.8442C334.036 29.8135 333.939 28.7981 333.433 28.1238C332.927 27.4495 332.068 27.1074 330.351 26.4232C287.557 9.37441 240.873 0 192 0C143.127 0 96.4433 9.37442 53.6492 26.4232C51.9319 27.1074 51.0732 27.4495 50.5672 28.1238C50.0612 28.7981 49.9636 29.8135 49.7683 31.8442C47.5221 55.2085 29.1964 73.8747 5.9892 76.645C3.00504 77.0012 1.51296 77.1793 0.756479 78.0315C0 78.8836 0 80.2558 0 83V324H384V83C384 80.2558 384 78.8836 383.244 78.0315C382.487 77.1793 380.995 77.0012 378.011 76.645C354.804 73.8747 336.478 55.2084 334.232 31.8442Z"/>
  </clipPath>
  <g clip-path="url(#photoClip)">
    <image x="0" y="0" width="384" height="324" href="${data.photo}" preserveAspectRatio="xMidYMid slice"/>
  </g>`;
    filled = filled.replace(photoBlock, photoReplacement);
  } else {
    // Remove placeholder text if no photo
    filled = filled.replace(/<text x="242" y="162"[^>]*>\{\{PHOTO\}\}<\/text>/, "");
  }

  const statMap: Record<string, number> = {
    PROJ: Math.min(99, data.proj ?? 0),
    TECH: Math.min(99, data.tech ?? 0),
    CONT: Math.min(99, data.cont ?? 0),
    YEXP: Math.min(99, data.yexp ?? 0),
    CERT: Math.min(99, data.cert ?? 0),
    LANG: Math.min(99, data.lang ?? 0),
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
