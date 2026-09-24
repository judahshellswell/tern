import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebase-admin";

// Best-effort — a failed increment should never break the job detail
// page render. Called once per real page load (see app/jobs/[id]/page.tsx),
// never from inside the metadata-generating fetch, to avoid double-counting.
// Lives here rather than in app/actions.ts so it isn't a public endpoint
// anyone could call in a loop to inflate a job's views.
export async function incrementJobViewCount(jobId: string): Promise<void> {
  try {
    await getAdminFirestore()
      .collection("jobs")
      .doc(jobId)
      .update({ viewCount: FieldValue.increment(1) });
  } catch (err) {
    console.error(`Failed to increment view count for job ${jobId}:`, err);
  }
}
