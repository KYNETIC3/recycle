import type { Metadata } from "next";
import { AssessmentFlow } from "./AssessmentFlow";

export const metadata: Metadata = { title: "New assessment | eLoop" };

export default function AssessPage() {
  return <AssessmentFlow />;
}
