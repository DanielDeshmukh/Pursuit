import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_MODEL = "meta/llama-3.1-8b-instruct";

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
  const m = text.match(/\b(?:Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Noida|Gurgaon|New York|San Francisco|London|Berlin|Toronto|Singapore|Seattle|Boston|Austin|Chicago|Los Angeles|Remote)\b/i);
  return m ? m[0] : null;
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

const EXTRACT_PROMPT = `You are an expert resume parser. Extract ALL information from the raw resume text below and return ONLY a valid JSON object. Do NOT include any explanation, markdown, or code fences — just the raw JSON.

The JSON MUST follow this exact schema:

{
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "linkedinUrl": "full linkedin url or null",
  "portfolioUrl": "github or portfolio url or null",
  "city": "city name or null",
  "country": "country name or null",
  "currentTitle": "most recent job title or null",
  "currentCompany": "most recent company or null",
  "yearsExperience": "total years as string or null",
  "education": "concise education string like 'BS Computer Science, University of Mumbai, 2026' or null",
  "skills": "comma-separated skill list or null",
  "summary": "a professional summary of AT MOST 100 words capturing the person's identity, key strengths, and career focus. Write it as a third-person or first-person professional statement. Do NOT dump raw resume text here.",
  "workExperience": [
    {
      "company": "company name",
      "role": "job title",
      "startDate": "e.g. Jul 2024",
      "endDate": "e.g. Mar 2026 or Present",
      "location": "city, country or null",
      "bullets": ["achievement or responsibility bullet 1", "bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "one-line description",
      "tech": "comma-separated tech stack used",
      "bullets": ["what was built or achieved", "bullet 2"]
    }
  ]
}

RULES:
- Extract EVERY job from work experience, not just the most recent
- Extract EVERY project listed
- summary MUST be max 100 words — a concise professional narrative, NOT raw text
- bullets should be concise achievements, not paragraphs
- If a field is not found, use null (for strings) or [] (for arrays)
- Do NOT hallucinate or invent information not in the resume
- Return ONLY the JSON object, nothing else

RESUME TEXT:
`;

async function callNIM(text: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const truncated = text.slice(0, 8000);

  try {
    const resp = await fetch(NIM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages: [
          { role: "system", content: "You are a resume parsing assistant. Return ONLY valid JSON, no markdown, no code fences, no explanation." },
          { role: "user", content: EXTRACT_PROMPT + truncated },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
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

    const nimResult = await callNIM(text);

    if (nimResult) {
      const profile = {
        firstName: (nimResult.firstName as string) || null,
        lastName: (nimResult.lastName as string) || null,
        email: (nimResult.email as string) || extractEmail(text),
        phone: (nimResult.phone as string) || extractPhone(text),
        linkedinUrl: (nimResult.linkedinUrl as string) || extractLinkedIn(text),
        portfolioUrl: (nimResult.portfolioUrl as string) || extractGithub(text),
        city: (nimResult.city as string) || extractLocation(text),
        country: (nimResult.country as string) || null,
        currentTitle: (nimResult.currentTitle as string) || null,
        currentCompany: (nimResult.currentCompany as string) || null,
        yearsExperience: (nimResult.yearsExperience as string) || null,
        education: (nimResult.education as string) || extractEducation(text),
        skills: (nimResult.skills as string) || extractSkills(text),
        summary: (nimResult.summary as string) || null,
        workExperience: nimResult.workExperience || [],
        projects: nimResult.projects || [],
      };
      return NextResponse.json({ profile });
    }

    const name = extractName(text);
    const profile = {
      firstName: name?.firstName || null,
      lastName: name?.lastName || null,
      email: extractEmail(text),
      phone: extractPhone(text),
      linkedinUrl: extractLinkedIn(text),
      portfolioUrl: extractGithub(text),
      city: extractLocation(text),
      country: null,
      currentTitle: null,
      currentCompany: null,
      yearsExperience: null,
      education: extractEducation(text),
      skills: extractSkills(text),
      summary: null,
      workExperience: [],
      projects: [],
    };
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
