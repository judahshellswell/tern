import type { MetadataRoute } from "next";

// Makes Tern installable to the home screen. On iOS this is also what
// unlocks Web Push at all — Safari only allows push for sites the user
// has added to their home screen (iOS 16.4+).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tern — Jersey jobs for students",
    short_name: "Tern",
    description:
      "Part-time jobs, apprenticeships, internships and seasonal work for Jersey's students and early-career talent.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#1f5f5b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
