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
  const m = text.match(/github\.com\/[a-zA-Z0-9_-]+(?=\/|$|\s)/i);
  return m ? `https://${m[0]}` : null;
}

function extractPortfolio(text: string, githubUrl: string | null) {
  const urls = text.match(/https?:\/\/[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}/gi) || [];
  for (const url of urls) {
    const lower = url.toLowerCase();
    if (lower.includes("linkedin.com") || lower.includes("github.com")) continue;
    if (githubUrl && lower === githubUrl.toLowerCase()) continue;
    if (lower.match(/\.(com|io|dev|me|tech|online|site|xyz|portfolio)\b/)) {
      return url;
    }
  }
  return null;
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

const EXTRACT_PROMPT = `You are an expert resume parser. Extract ALL information from the raw resume text below and return ONLY a valid JSON object. No markdown, no code fences, no explanation — just raw JSON.

JSON schema:
{
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "linkedinUrl": "full linkedin URL or null",
  "githubUrl": "full github.com URL or null — ONLY if explicitly listed",
  "portfolioUrl": "personal website/portfolio URL (NOT github, NOT linkedin) or null",
  "city": "city name or null",
  "country": "country name or null",
  "currentTitle": "most recent job title or null",
  "currentCompany": "most recent company or null",
  "yearsExperience": "total years as string or null",
  "education": "concise education string or null",
  "skills": "comma-separated skill list or null",
  "summary": "professional summary max 100 words — a concise narrative, NOT raw text",
  "workExperience": [
    {
      "company": "company name",
      "role": "job title",
      "startDate": "e.g. Jul 2024",
      "endDate": "e.g. Mar 2026 or Present",
      "location": "city, country or null",
      "bullets": ["achievement bullet 1", "bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "one-line description",
      "tech": "comma-separated tech stack",
      "bullets": ["what was built", "bullet 2"]
    }
  ]
}

CRITICAL RULES:
- workExperience must be an ARRAY of objects — extract EVERY job listed
- projects must be an ARRAY of objects — extract EVERY project listed
- bullets must be ARRAYS of strings
- githubUrl and portfolioUrl are DIFFERENT — githubUrl is github.com/*, portfolioUrl is personal website
- summary MUST be max 100 words
- Do NOT invent information
- Return ONLY the JSON, nothing else

RESUME TEXT:
`;

async function callNIM(text: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn("[resume-parse] NVIDIA_API_KEY not set, skipping NIM");
    return null;
  }

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
          { role: "system", content: "Return ONLY valid JSON. No markdown. No code fences. No explanation." },
          { role: "user", content: EXTRACT_PROMPT + truncated },
        ],
        temperature: 0.05,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) {
      console.error("[resume-parse] NIM response not ok:", resp.status);
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[resume-parse] No content in NIM response");
      return null;
    }

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.workExperience && typeof parsed.workExperience === "string") {
      try { parsed.workExperience = JSON.parse(parsed.workExperience); } catch { parsed.workExperience = []; }
    }
    if (parsed.projects && typeof parsed.projects === "string") {
      try { parsed.projects = JSON.parse(parsed.projects); } catch { parsed.projects = []; }
    }

    if (!Array.isArray(parsed.workExperience)) parsed.workExperience = [];
    if (!Array.isArray(parsed.projects)) parsed.projects = [];

    return parsed;
  } catch (e) {
    console.error("[resume-parse] NIM error:", e);
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
      const nimGithub = (nimResult.githubUrl as string) || null;
      const nimPortfolio = (nimResult.portfolioUrl as string) || null;
      const regexGithub = extractGithub(text);
      const regexPortfolio = extractPortfolio(text, regexGithub);

      const profile = {
        firstName: (nimResult.firstName as string) || null,
        lastName: (nimResult.lastName as string) || null,
        email: (nimResult.email as string) || extractEmail(text),
        phone: (nimResult.phone as string) || extractPhone(text),
        linkedinUrl: (nimResult.linkedinUrl as string) || extractLinkedIn(text),
        githubUrl: nimGithub || regexGithub,
        portfolioUrl: nimPortfolio || regexPortfolio,
        city: (nimResult.city as string) || extractLocation(text),
        country: (nimResult.country as string) || null,
        currentTitle: (nimResult.currentTitle as string) || null,
        currentCompany: (nimResult.currentCompany as string) || null,
        yearsExperience: (nimResult.yearsExperience as string) || null,
        education: (nimResult.education as string) || null,
        skills: (nimResult.skills as string) || null,
        summary: (nimResult.summary as string) || null,
        workExperience: nimResult.workExperience || [],
        projects: nimResult.projects || [],
      };
      return NextResponse.json({ profile });
    }

    const name = extractName(text);
    const regexGithub = extractGithub(text);
    const profile = {
      firstName: name?.firstName || null,
      lastName: name?.lastName || null,
      email: extractEmail(text),
      phone: extractPhone(text),
      linkedinUrl: extractLinkedIn(text),
      githubUrl: regexGithub,
      portfolioUrl: extractPortfolio(text, regexGithub),
      city: extractLocation(text),
      country: null,
      currentTitle: null,
      currentCompany: null,
      yearsExperience: null,
      education: null,
      skills: null,
      summary: null,
      workExperience: [],
      projects: [],
    };
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
