import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendClosingSoonReminder } from "@/lib/closing-reminder-notification";

const REMINDER_DAYS_BEFORE = 3;

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Vercel Cron hits this once daily. Not a "use server" action — nothing
// on the client ever calls this, only the scheduler, so it's a plain
// route handler guarded by a bearer token instead.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + REMINDER_DAYS_BEFORE);
  const targetDateString = toDateString(targetDate);

  const db = getAdminFirestore();
  const jobsSnap = await db
    .collection("jobs")
    .where("status", "==", "published")
    .where("closeDate", "==", targetDateString)
    .get();

  let sent = 0;
  let skipped = 0;

  for (const jobDoc of jobsSnap.docs) {
    const job = jobDoc.data();
    if (job.closingReminderSentAt) {
      skipped++;
      continue;
    }

    const employerSnap = await db.collection("users").doc(job.employerId).get();
    const employer = employerSnap.data();
    if (!employer || employer.role !== "employer") {
      continue;
    }

    try {
      await sendClosingSoonReminder({
        employerEmail: employer.email,
        employerName: employer.businessName,
        jobId: jobDoc.id,
        jobTitle: job.title,
        closeDate: job.closeDate,
      });
      await jobDoc.ref.update({ closingReminderSentAt: new Date().toISOString() });
      sent++;
    } catch (err) {
      console.error(`Failed to send closing-soon reminder for job ${jobDoc.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, checkedDate: targetDateString });
}
