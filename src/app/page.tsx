import { Calculator } from "@/components/Calculator";
import { feedbackEnv } from "@/lib/feedback/feedback";

export default function Home() {
  // the suggestions form shows only when the mail settings are in the environment (ADR 0120)
  return <Calculator feedback={feedbackEnv(process.env) !== undefined} />;
}
