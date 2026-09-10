import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, companyName, jobDescription, resumeText } = await req.json();

    if (!jobTitle || !companyName) {
      return NextResponse.json(
        { error: "jobTitle and companyName are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const prompt = `You are an expert career coach preparing a candidate for a job interview. Generate comprehensive interview prep materials.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}` : ""}
${resumeText ? `\nCANDIDATE RESUME:\n${resumeText.slice(0, 2000)}` : ""}

Generate the following:

1. LIKELY INTERVIEW QUESTIONS (8-10 questions) with strong sample answers
2. QUESTIONS TO ASK THE INTERVIEWER (5 thoughtful questions)
3. KEY TALKING POINTS (5-6 points about why this candidate is a good fit)
4. COMPANY RESEARCH NOTES (what to know about the company)
5. STAR FORMAT EXAMPLES (2 examples using Situation, Task, Action, Result)

Return your response as JSON with these exact keys:
{
  "questions": [
    {"question": "...", "answer": "...", "tip": "brief tip for this question"}
  ],
  "questionsToAsk": [
    {"question": "...", "why": "why this is a good question"}
  ],
  "talkingPoints": [
    "talking point 1",
    "talking point 2"
  ],
  "companyResearch": [
    "fact 1 about the company",
    "fact 2"
  ],
  "starExamples": [
    {
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "..."
    }
  ]
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
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[interview-prep] Groq error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[interview-prep] No JSON in response:", raw);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      questions: parsed.questions || [],
      questionsToAsk: parsed.questionsToAsk || [],
      talkingPoints: parsed.talkingPoints || [],
      companyResearch: parsed.companyResearch || [],
      starExamples: parsed.starExamples || [],
    });
  } catch (e) {
    console.error("[interview-prep]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
