import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { company, jobTitle, contactName, channel, yourName } = await req.json();

    if (!company || !jobTitle) {
      return NextResponse.json({ error: "company and jobTitle are required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const recipient = contactName || "the hiring manager";
    const channelHint =
      channel === "linkedin"
        ? "This is a LinkedIn message — keep it concise, professional, and conversational. No subject line needed."
        : "This is a formal email — include a clear subject line and professional sign-off.";

    const prompt = `You are an expert job seeker writing outreach messages. Generate a personalized ${channel} message for the following context:

- Company: ${company}
- Job Title: ${jobTitle}
- Recipient Name: ${recipient}
- Sender Name: ${yourName || "the applicant"}

${channelHint}

Requirements:
- Be specific to the company and role (no generic filler)
- Reference the specific position
- Show genuine interest and enthusiasm
- Keep it concise: ${channel === "linkedin" ? "3-5 sentences max" : "4-6 sentences for the body"}
- Include a clear call to action
- Tone: confident but not arrogant, warm but professional

Return your response as JSON with these exact keys:
{
  "subject": "subject line here (use empty string for LinkedIn)",
  "body": "the message body here"
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
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[outreach-generate] Groq error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[outreach-generate] No JSON in response:", raw);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      subject: parsed.subject || "",
      body: parsed.body || "",
    });
  } catch (e) {
    console.error("[outreach-generate]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
