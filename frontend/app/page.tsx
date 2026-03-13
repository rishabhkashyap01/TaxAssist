import { redirect } from "next/navigation";

// Root → redirect to filing (middleware will redirect to /login if not authed)
export default function Home() {
  redirect("/filing");
}
