import { redirect } from "next/navigation";

/** The new Lift IQ UI is the product. Old chrome stays at legacy routes. */
export default function Home() {
  redirect("/v2");
}
