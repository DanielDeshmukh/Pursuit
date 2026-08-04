import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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

const MONTHS = `(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)`;
const DATE_PATTERN = `${MONTHS}\\s+\\d{4}`;
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

      const dateStr = dateMatch[0];
      const beforeDate = clean(line.slice(0, line.indexOf(dateStr)));
      const afterDate = clean(line.slice(line.indexOf(dateStr) + dateStr.length));
      const dates = dateStr.split(/[-–—]/).map((d) => clean(d));

      let company = "";
      let role = "";
      let location = "";

      const pipeParts = beforeDate.split("|").map((p) => clean(p));
      if (pipeParts.length >= 2) {
        role = pipeParts[0];
        company = pipeParts[1];
        if (pipeParts.length >= 3) location = pipeParts[2];
      } else if (beforeDate.includes(" at ")) {
        const atParts = beforeDate.split(/\s+at\s+/i);
        role = atParts[0];
        company = atParts[1];
      } else {
        role = beforeDate;
      }

      const locFromAfter = afterDate.match(/(?:·\s*)?\b(?:Mumbai|Delhi|Bangalore|Bengaluru|Pune|Hyderabad|Chennai|Remote|Online|On-site|New York|San Francisco|London|Berlin|Toronto|Singapore|Seattle|Boston|Austin|Chicago|Los Angeles)\b/i);
      if (locFromAfter && !location) location = clean(locFromAfter[0].replace(/^·\s*/, ""));

      currentJob = {
        company,
        role,
        startDate: dates[0] || "",
        endDate: dates[1] || "",
        location,
        bullets: [],
      };
    } else if (currentJob && line.match(/^[•\-*–]\s*/)) {
      currentJob.bullets.push(clean(line.replace(/^[•\-*–]\s*/, "")));
    }
  }

  if (currentJob && (currentJob.company || currentJob.role)) {
    jobs.push(currentJob);
  }

  return jobs;
}

function extractProjectsRegex(text: string): { name: string; description: string; tech: string; bullets: string[] }[] {
  const projects: { name: string; description: string; tech: string; bullets: string[] }[] = [];

  const projectSectionMatch = text.match(/\n\s*(?:PROJECTS?|PERSONAL PROJECTS?|KEY PROJECTS?|SIDE PROJECTS?|FEATURED PROJECTS?)\s*\n/i);
  if (!projectSectionMatch) return projects;

  const startIdx = projectSectionMatch.index! + projectSectionMatch[0].length;
  const remaining = text.slice(startIdx);

  const nextSection = remaining.match(/\n\s*(?:EDUCATION|CERTIFICATIONS?|WORK EXPERIENCE|SKILLS?|TECHNICAL SKILLS|PROFESSIONAL SUMMARY|REFERENCES?|AWARDS?|PUBLICATIONS?)\s*\n/i);
  const endIdx = nextSection ? nextSection.index! : Math.min(remaining.length, 4000);
  const section = remaining.slice(0, endIdx);

  const lines = section.split("\n");
  let currentProject: { name: string; description: string; tech: string; bullets: string[] } | null = null;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    if (l.match(/^[•\-*–]\s*/)) {
      if (currentProject) {
        currentProject.bullets.push(clean(l.replace(/^[•\-*–]\s*/, "")));
      }
    } else if (l.includes("—") || l.includes("–") || l.includes(" - ")) {
      if (currentProject && (currentProject.name || currentProject.description)) {
        projects.push(currentProject);
      }

      const dashParts = l.split(/\s*[—–]\s*|\s+-\s+/).map((p) => clean(p));
      let name = dashParts[0] || "";
      let description = "";
      let tech = "";

      if (dashParts.length >= 3) {
        description = dashParts[1];
        tech = dashParts[2].replace(/\s*(?:●|✓|✔|Deployed|Live|Active)\s*/g, "").trim();
      } else if (dashParts.length === 2) {
        description = dashParts[1].replace(/\s*(?:●|✓|✔|Deployed|Live|Active)\s*/g, "").trim();
      }

      currentProject = { name, description, tech, bullets: [] };
    } else if (l.match(/^(?:Additional Projects?:?)/i)) {
      if (currentProject && (currentProject.name || currentProject.description)) {
        projects.push(currentProject);
        currentProject = null;
      }
      const additionalText = clean(l.replace(/^Additional Projects?:?\s*/i, ""));
      if (additionalText) {
        const parts = additionalText.split(/[,;]/).map((p) => clean(p));
        for (const part of parts) {
          const nameMatch = part.match(/^([^((]+)\s*\((.+)\)/);
          if (nameMatch) {
            projects.push({
              name: clean(nameMatch[1]),
              description: clean(nameMatch[2]),
              tech: "",
              bullets: [],
            });
          } else if (part.length > 3) {
            projects.push({ name: part, description: "", tech: "", bullets: [] });
          }
        }
      }
      currentProject = null;
    } else if (l.length > 3 && l.length < 120 && !l.match(/^(?:Deployed|Live|Active|●|✓)/i)) {
      if (currentProject && (currentProject.name || currentProject.description)) {
        projects.push(currentProject);
      }
      currentProject = { name: l, description: "", tech: "", bullets: [] };
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

function cleanSkills(raw: string): string {
  const CATEGORY_PATTERN = /^(?:Languages|Frontend|Backend|Backend & Infrastructure|DevOps|Databases?|Cloud|Frameworks?|Libraries?|Tools?|Technologies|Skills?|Other|Platforms?|Operating Systems?|Soft Skills?|Domain Knowledge?)\s*:\s*/i;
  const skills = raw.split(/[,;•|·\n]/);
  const cleaned: string[] = [];
  for (let s of skills) {
    s = s.trim();
    if (s.length < 2) continue;
    s = s.replace(CATEGORY_PATTERN, "").trim();
    if (s.length < 2) continue;
    cleaned.push(...s.split(/\s{2,}/));
  }
  return cleaned.map((s) => s.trim()).filter((s, i, arr) => s.length > 1 && arr.indexOf(s) === i).join(", ");
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

async function callLLM(text: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[resume-parse] GROQ_API_KEY not set");
    return null;
  }

  try {
    const resp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "Return ONLY valid JSON." },
          { role: "user", content: EXTRACT_PROMPT + text.slice(0, 16000) },
        ],
        temperature: 0.05,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) {
      console.error("[resume-parse] Groq HTTP error:", resp.status, await resp.text().catch(() => ""));
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[resume-parse] Groq empty response");
      return null;
    }

    console.log("[resume-parse] Groq raw response length:", content.length);

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

    console.log("[resume-parse] Groq extracted:", {
      name: `${parsed.firstName} ${parsed.lastName}`,
      workCount: parsed.workExperience.length,
      projectCount: parsed.projects.length,
      hasSkills: !!parsed.skills,
      hasSummary: !!parsed.summary,
    });

    return parsed;
  } catch (e) {
    console.error("[resume-parse] Groq error:", e);
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

    const llmResult = await callLLM(text);

    const regexGithub = extractGithub(text);
    const regexPortfolio = extractPortfolio(text, regexGithub);

    if (llmResult) {
      let workExp = llmResult.workExperience as { company: string; role: string; startDate: string; endDate: string; location: string; bullets: string[] }[];
      let projects = llmResult.projects as { name: string; description: string; tech: string; bullets: string[] }[];

      if (workExp.length === 0) {
        console.log("[resume-parse] LLM returned empty workExperience, trying regex");
        workExp = extractWorkExperienceRegex(text);
        console.log("[resume-parse] Regex found", workExp.length, "jobs");
      }

      if (projects.length === 0) {
        console.log("[resume-parse] LLM returned empty projects, trying regex");
        projects = extractProjectsRegex(text);
        console.log("[resume-parse] Regex found", projects.length, "projects");
      }

      const rawSkills = (llmResult.skills as string) || extractSkillsRegex(text);
      const skills = rawSkills ? cleanSkills(rawSkills) : null;

      const profile = {
        firstName: (llmResult.firstName as string) || null,
        lastName: (llmResult.lastName as string) || null,
        email: (llmResult.email as string) || extractEmail(text),
        phone: (llmResult.phone as string) || extractPhone(text),
        linkedinUrl: (llmResult.linkedinUrl as string) || extractLinkedIn(text),
        githubUrl: (llmResult.githubUrl as string) || regexGithub,
        portfolioUrl: (llmResult.portfolioUrl as string) || regexPortfolio,
        city: (llmResult.city as string) || extractLocation(text),
        country: (llmResult.country as string) || null,
        currentTitle: (llmResult.currentTitle as string) || null,
        currentCompany: (llmResult.currentCompany as string) || null,
        yearsExperience: (llmResult.yearsExperience as string) || null,
        education: (llmResult.education as string) || extractEducationRegex(text),
        skills,
        summary: (llmResult.summary as string) || null,
        workExperience: JSON.stringify(workExp),
        projects: JSON.stringify(projects),
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
      workExperience: JSON.stringify(workExp),
      projects: JSON.stringify(projects),
    };
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("[resume-parse] Fatal error:", e);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
