import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HostFlow",
    short_name: "HostFlow",
    description: "Simple restaurant waitlist management.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#d96a34",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
