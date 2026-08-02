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
    if (lower.match(/\.(com|io|dev|me|tech|online|site|xyz|portfolio)\b/)) return url;
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

const DATE_PATTERN = `(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s*\\d{4}`;
const DATE_RANGE = new RegExp(`${DATE_PATTERN}\\s*[-–—]\\s*(?:${DATE_PATTERN}|Present|Current|Now)`, "i");

function extractWorkExperienceRegex(text: string): { company: string; role: string; startDate: string; endDate: string; location: string; bullets: string[] }[] {
  const jobs: { company: string; role: string; startDate: string; endDate: string; location: string; bullets: string[] }[] = [];

  const lines = text.split("\n");
  let currentJob: { company: string; role: string; startDate: string; endDate: string; location: string; bullets: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const dateMatch = line.match(DATE_RANGE);
    if (dateMatch) {
      if (currentJob && (currentJob.company || currentJob.role)) {
        jobs.push(currentJob);
      }

      const parts = line.split(DATE_RANGE);
      const beforeDate = clean(parts[0] || "");
      const dateStr = dateMatch[0];
      const dates = dateStr.split(/[-–—]/).map((d) => clean(d));

      let company = "";
      let role = "";
      let location = "";

      const pipeParts = beforeDate.split("|").map((p) => clean(p));
      if (pipeParts.length >= 3) {
        role = pipeParts[0];
        company = pipeParts[1];
        location = pipeParts[2];
      } else if (pipeParts.length === 2) {
        role = pipeParts[0];
        company = pipeParts[1];
      } else if (beforeDate.includes(" at ")) {
        const atParts = beforeDate.split(/\s+at\s+/i);
        role = atParts[0];
        company = atParts[1];
      } else if (beforeDate.includes(", ")) {
        const commaParts = beforeDate.split(",");
        role = commaParts[0];
        company = commaParts.slice(1).join(",");
      } else {
        role = beforeDate;
      }

      const locMatch = line.match(/\b(?:Mumbai|Delhi|Bangalore|Bengaluru|Pune|Hyderabad|Chennai|Remote|Online|On-site)\b/i);
      if (locMatch && !location) location = locMatch[0];

      currentJob = {
        company,
        role,
        startDate: dates[0] || "",
        endDate: dates[1] || "",
        location,
        bullets: [],
      };
    } else if (currentJob && line.match(/^[-•*–]\s*/)) {
      currentJob.bullets.push(clean(line.replace(/^[-•*–]\s*/, "")));
    } else if (currentJob && line.length > 10 && !line.match(/^\d/) && !currentJob.company) {
      if (!currentJob.role) currentJob.role = line;
    }
  }

  if (currentJob && (currentJob.company || currentJob.role)) {
    jobs.push(currentJob);
  }

  return jobs;
}

function extractProjectsRegex(text: string): { name: string; description: string; tech: string; bullets: string[] }[] {
  const projects: { name: string; description: string; tech: string; bullets: string[] }[] = [];

  const projectSectionMatch = text.match(/\n\s*(?:Projects?|Personal Projects?|Key Projects?|Side Projects?|Featured Projects?)\s*\n/i);
  if (!projectSectionMatch) return projects;

  const startIdx = projectSectionMatch.index! + projectSectionMatch[0].length;
  const remaining = text.slice(startIdx);

  const nextSection = remaining.match(/\n\s*[A-Z][A-Za-z &/]{2,30}\s*\n/);
  const endIdx = nextSection ? nextSection.index! : Math.min(remaining.length, 3000);
  const section = remaining.slice(0, endIdx);

  const lines = section.split("\n");
  let currentProject: { name: string; description: string; tech: string; bullets: string[] } | null = null;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    if (l.match(/^[-•*–]\s*/)) {
      if (currentProject) {
        currentProject.bullets.push(clean(l.replace(/^[-•*–]\s*/, "")));
      }
    } else if (l.match(/\b(?:React|Node|Python|Java|TypeScript|JavaScript|Next\.js|Express|FastAPI|Django|Flask|MongoDB|PostgreSQL|SQL|Docker|AWS|GCP|Supabase|Firebase|Tailwind|HTML|CSS|Git|REST|GraphQL|Redis|Kubernetes|Machine Learning|AI|NLP|TensorFlow|PyTorch|LangChain|LangGraph|RAG|Vector|API|CLI|Web|App|Dashboard|System|Platform|Engine|Bot|Agent|Automation)\b/i) && l.length < 80) {
      if (currentProject && !currentProject.tech) {
        currentProject.tech = clean(l.replace(/^[-•*–]\s*/, ""));
      }
    } else if (l.length > 3 && l.length < 100) {
      if (currentProject && (currentProject.name || currentProject.description)) {
        projects.push(currentProject);
      }
      currentProject = {
        name: l.replace(/^[-•*–]\s*/, ""),
        description: "",
        tech: "",
        bullets: [],
      };
    }
  }

  if (currentProject && (currentProject.name || currentProject.description)) {
    projects.push(currentProject);
  }

  return projects;
}

function extractEducationRegex(text: string) {
  const section = text.match(/\n\s*(?:Education|Academic|Qualification)\s*\n/i);
  if (!section) return null;
  const start = section.index! + section[0].length;
  const remaining = text.slice(start);
  const nextSection = remaining.match(/\n\s*[A-Z][A-Za-z &/]{2,30}\s*\n/);
  const end = nextSection ? nextSection.index! : Math.min(remaining.length, 1000);
  return clean(remaining.slice(0, end));
}

function extractSkillsRegex(text: string) {
  const section = text.match(/\n\s*(?:Skills?|Technical Skills?|Technologies|Competencies|Tech Stack)\s*\n/i);
  if (!section) return null;
  const start = section.index! + section[0].length;
  const remaining = text.slice(start);
  const nextSection = remaining.match(/\n\s*[A-Z][A-Za-z &/]{2,30}\s*\n/);
  const end = nextSection ? nextSection.index! : Math.min(remaining.length, 1500);
  return clean(remaining.slice(0, end)).split(/[,;•|·\n]/).filter((s) => s.trim().length > 1).join(", ");
}

const EXTRACT_PROMPT = `Extract ALL information from this resume and return ONLY valid JSON. No markdown, no code fences.

Return this JSON:
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "linkedinUrl": "linkedin URL",
  "githubUrl": "github URL (only if explicitly listed)",
  "portfolioUrl": "personal website URL (not github, not linkedin)",
  "city": "city",
  "country": "country",
  "currentTitle": "most recent job title",
  "currentCompany": "most recent company",
  "yearsExperience": "total years as string",
  "education": "concise education string",
  "skills": "comma-separated skills",
  "summary": "professional summary max 100 words",
  "workExperience": [
    {
      "company": "company name",
      "role": "job title",
      "startDate": "e.g. Jul 2024",
      "endDate": "e.g. Mar 2026 or Present",
      "location": "city, country",
      "bullets": ["achievement 1", "achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "one-line description",
      "tech": "comma-separated tech",
      "bullets": ["what was built", "feature 2"]
    }
  ]
}

RULES:
- workExperience: ARRAY — extract EVERY job. Look for date ranges like "Jul 2024 – Mar 2026" or "May 2024 – Present". The line before/around the date is the role and company.
- projects: ARRAY — extract EVERY project. Look for project names, tech stacks, bullet points.
- bullets must be arrays of strings
- summary max 100 words
- Return ONLY the JSON object

RESUME:
`;

async function callNIM(text: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn("[resume-parse] NVIDIA_API_KEY not set");
    return null;
  }

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
          { role: "system", content: "Return ONLY valid JSON." },
          { role: "user", content: EXTRACT_PROMPT + text.slice(0, 8000) },
        ],
        temperature: 0.05,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) {
      console.error("[resume-parse] NIM HTTP error:", resp.status, await resp.text().catch(() => ""));
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[resume-parse] NIM empty response");
      return null;
    }

    console.log("[resume-parse] NIM raw response length:", content.length);

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

    console.log("[resume-parse] NIM extracted:", {
      name: `${parsed.firstName} ${parsed.lastName}`,
      workCount: parsed.workExperience.length,
      projectCount: parsed.projects.length,
      hasSkills: !!parsed.skills,
      hasSummary: !!parsed.summary,
    });

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

    console.log("[resume-parse] PDF text length:", text.length);
    console.log("[resume-parse] First 500 chars:", text.slice(0, 500));

    const nimResult = await callNIM(text);

    const regexGithub = extractGithub(text);
    const regexPortfolio = extractPortfolio(text, regexGithub);

    if (nimResult) {
      let workExp = nimResult.workExperience as { company: string; role: string; startDate: string; endDate: string; location: string; bullets: string[] }[];
      let projects = nimResult.projects as { name: string; description: string; tech: string; bullets: string[] }[];

      if (workExp.length === 0) {
        console.log("[resume-parse] NIM returned empty workExperience, trying regex");
        workExp = extractWorkExperienceRegex(text);
        console.log("[resume-parse] Regex found", workExp.length, "jobs");
      }

      if (projects.length === 0) {
        console.log("[resume-parse] NIM returned empty projects, trying regex");
        projects = extractProjectsRegex(text);
        console.log("[resume-parse] Regex found", projects.length, "projects");
      }

      const profile = {
        firstName: (nimResult.firstName as string) || null,
        lastName: (nimResult.lastName as string) || null,
        email: (nimResult.email as string) || extractEmail(text),
        phone: (nimResult.phone as string) || extractPhone(text),
        linkedinUrl: (nimResult.linkedinUrl as string) || extractLinkedIn(text),
        githubUrl: (nimResult.githubUrl as string) || regexGithub,
        portfolioUrl: (nimResult.portfolioUrl as string) || regexPortfolio,
        city: (nimResult.city as string) || extractLocation(text),
        country: (nimResult.country as string) || null,
        currentTitle: (nimResult.currentTitle as string) || null,
        currentCompany: (nimResult.currentCompany as string) || null,
        yearsExperience: (nimResult.yearsExperience as string) || null,
        education: (nimResult.education as string) || extractEducationRegex(text),
        skills: (nimResult.skills as string) || extractSkillsRegex(text),
        summary: (nimResult.summary as string) || null,
        workExperience: workExp,
        projects: projects,
      };
      return NextResponse.json({ profile });
    }

    const name = extractName(text);
    const workExp = extractWorkExperienceRegex(text);
    const projects = extractProjectsRegex(text);

    console.log("[resume-parse] Regex-only fallback: work=", workExp.length, "projects=", projects.length);

    const profile = {
      firstName: name?.firstName || null,
      lastName: name?.lastName || null,
      email: extractEmail(text),
      phone: extractPhone(text),
      linkedinUrl: extractLinkedIn(text),
      githubUrl: regexGithub,
      portfolioUrl: regexPortfolio,
      city: extractLocation(text),
      country: null,
      currentTitle: null,
      currentCompany: null,
      yearsExperience: null,
      education: extractEducationRegex(text),
      skills: extractSkillsRegex(text),
      summary: null,
      workExperience: workExp,
      projects: projects,
    };
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("[resume-parse] Fatal error:", e);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
