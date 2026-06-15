import { StudioClient } from "@/components/editor/StudioClient";

export const metadata = {
  title: "Studio — NourQuran",
};

/**
 * Page Studio (Server Component léger qui délègue tout au client).
 * La logique interactive et Remotion Player vivent dans StudioClient.
 */
export default function StudioPage() {
  return <StudioClient />;
}
