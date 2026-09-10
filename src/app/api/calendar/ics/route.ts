import { NextRequest, NextResponse } from "next/server";
import ical from "ical-generator";

export async function POST(req: NextRequest) {
  try {
    const { title, description, startDate, endDate, location } = await req.json();

    if (!title || !startDate) {
      return NextResponse.json(
        { error: "title and startDate are required" },
        { status: 400 }
      );
    }

    const calendar = ical({ name: "Pursuit Reminders" });

    calendar.createEvent({
      start: new Date(startDate),
      end: endDate ? new Date(endDate) : new Date(new Date(startDate).getTime() + 30 * 60 * 1000),
      summary: title,
      description: description || "",
      location: location || undefined,
    });

    const icsContent = calendar.toString();

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics"`,
      },
    });
  } catch (e) {
    console.error("[calendar-ics]", e);
    return NextResponse.json({ error: "Failed to generate calendar file" }, { status: 500 });
  }
}
