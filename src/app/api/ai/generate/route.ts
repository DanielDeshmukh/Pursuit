import { NextRequest, NextResponse } from "next/server";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { fieldLabel, fieldContext, jobTitle, companyName, jobDescription, profile } = await req.json();

    if (!NVIDIA_API_KEY) {
      return NextResponse.json({ error: "NVIDIA API key not configured" }, { status: 500 });
    }

    const profileSummary = [
      profile.firstName && profile.lastName && `Name: ${profile.firstName} ${profile.lastName}`,
      profile.currentTitle && `Current Title: ${profile.currentTitle}`,
      profile.currentCompany && `Current Company: ${profile.currentCompany}`,
      profile.yearsExperience && `Years of Experience: ${profile.yearsExperience}`,
      profile.skills && `Skills: ${profile.skills}`,
      profile.bio && `Bio: ${profile.bio}`,
      profile.education && `Education: ${profile.education}`,
      profile.workAuthorization && `Work Authorization: ${profile.workAuthorization}`,
      profile.coverLetterTemplate && `Cover Letter Style: ${profile.coverLetterTemplate}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are a job application assistant. Generate a concise, professional response for a job application form field. 
The response should be tailored to the specific job and company.
Keep responses under 200 words unless specifically asked for more.
Never use markdown formatting. Write in plain text.
Be specific and relevant to the job description.`;

    const userPrompt = `Job: ${jobTitle} at ${companyName}
${jobDescription ? `Job Description: ${jobDescription.slice(0, 1000)}` : ""}

Applicant Profile:
${profileSummary}

Task: Generate a response for this form field:
Field: ${fieldLabel}
${fieldContext ? `Context: ${fieldContext}` : ""}

Provide ONLY the response text, nothing else.`;

    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `NVIDIA API error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const generated = data.choices?.[0]?.message?.content?.trim();

    if (!generated) {
      return NextResponse.json({ error: "No content generated" }, { status: 502 });
    }

    return NextResponse.json({ content: generated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
