import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription, jobTitle, companyName } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "resumeText and jobDescription are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const prompt = `You are an expert resume writer and career coach. Tailor the following resume to best match the job description provided.

JOB TITLE: ${jobTitle || "Not specified"}
COMPANY: ${companyName || "Not specified"}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

ORIGINAL RESUME:
${resumeText.slice(0, 4000)}

TASK: Create a tailored version of this resume that:
1. Reorders skills to put the most relevant ones first
2. Rewrites the professional summary to highlight relevant experience
3. Adjusts bullet points in work experience to emphasize matching skills
4. Keeps all factual information accurate (don't fabricate experience)
5. Uses keywords from the job description naturally

Return your response as JSON with these exact keys:
{
  "summary": "tailored professional summary (2-3 sentences)",
  "skills": ["skill1", "skill2", ...],
  "highlights": [
    {"company": "Company Name", "role": "Role", "bullets": ["tailored bullet 1", "tailored bullet 2"]}
  ],
  "coverLetter": "a 3-4 paragraph cover letter tailored to this specific role and company"
}

Return ONLY valid JSON, no markdown fences or extra text.`;

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[resume-tailor] Groq error:", err);
      return NextResponse.json({ error: "AI tailoring failed" }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[resume-tailor] No JSON in response:", raw);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      summary: parsed.summary || "",
      skills: parsed.skills || [],
      highlights: parsed.highlights || [],
      coverLetter: parsed.coverLetter || "",
    });
  } catch (e) {
    console.error("[resume-tailor]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
