import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractEmail(text: string) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function extractPhone(text: string) {
  const m = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  return m ? m[0].trim() : null;
}

function extractLinkedIn(text: string) {
  const m = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  return m ? `https://www.${m[0]}` : null;
}

function extractGithub(text: string) {
  const m = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  return m ? `https://${m[0]}` : null;
}

function extractSection(text: string, headers: string[]) {
  for (const header of headers) {
    const regex = new RegExp(`(?:^|\\n)\\s*${header}\\s*(?:\\n|$|[\\r])`, "i");
    const match = text.match(regex);
    if (match) {
      const start = match.index! + match[0].length;
      const remaining = text.slice(start);
      const nextSection = remaining.match(/\n\s*[A-Z][A-Za-z &/]{2,30}\s*\n/);
      const end = nextSection ? nextSection.index! : Math.min(remaining.length, 2000);
      return clean(remaining.slice(0, end));
    }
  }
  return null;
}

function extractExperience(text: string) {
  const section = extractSection(text, ["experience", "work experience", "professional experience", "employment", "work history"]);
  if (!section) return null;
  const lines = section.split(/\n/).filter((l) => l.trim());
  const jobs = [];
  for (const line of lines) {
    if (line.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2}|present)\b/i)) {
      jobs.push(clean(line));
    }
  }
  return jobs.length > 0 ? jobs.join(" | ") : clean(section.slice(0, 500));
}

function extractEducation(text: string) {
  const section = extractSection(text, ["education", "academic", "qualification"]);
  if (!section) return null;
  const lines = section.split(/\n/).filter((l) => l.trim());
  const entries = [];
  for (const line of lines) {
    if (line.match(/\b(bachelor|master|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|phd|mba|degree|university|college|institute|20\d{2})\b/i)) {
      entries.push(clean(line));
    }
  }
  return entries.length > 0 ? entries.join(" | ") : clean(section.slice(0, 300));
}

function extractSkills(text: string) {
  const section = extractSection(text, ["skills", "technical skills", "technologies", "competencies", "tech stack"]);
  if (!section) return null;
  const lines = section.split(/\n/).filter((l) => l.trim());
  const skills = [];
  for (const line of lines) {
    const parts = line.split(/[,;•|·]/);
    for (const p of parts) {
      const s = clean(p);
      if (s && s.length > 1 && s.length < 50) skills.push(s);
    }
  }
  return skills.length > 0 ? skills.join(", ") : clean(section.slice(0, 500));
}

function extractName(text: string) {
  const lines = text.split(/\n/).slice(0, 10);
  for (const line of lines) {
    const l = clean(line);
    if (!l) continue;
    if (l.match(/@|\.com|phone|email|linkedin|address|resume|curriculum/i)) continue;
    const words = l.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => w[0] === w[0].toUpperCase())) {
      return { firstName: words[0], lastName: words.slice(1).join(" ") };
    }
  }
  return null;
}

function extractLocation(text: string) {
  const m = text.match(/\b(?:Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Noida|Gurgaon|Pune|New York|San Francisco|London|Berlin|Toronto|Singapore|Seattle|Boston|Austin|Chicago|Los Angeles|Remote)\b/i);
  return m ? m[0] : null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text;

    const name = extractName(text);
    const email = extractEmail(text);
    const phone = extractPhone(text);
    const linkedin = extractLinkedIn(text);
    const github = extractGithub(text);
    const location = extractLocation(text);
    const experience = extractExperience(text);
    const education = extractEducation(text);
    const skills = extractSkills(text);

    const profile = {
      firstName: name?.firstName || null,
      lastName: name?.lastName || null,
      email: email || null,
      phone: phone || null,
      linkedinUrl: linkedin || null,
      portfolioUrl: github || null,
      city: location || null,
      education: education || null,
      skills: skills || null,
      bio: experience || null,
    };

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
