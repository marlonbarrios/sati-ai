import type { Metadata } from "next";
import { OntologyNetwork } from "@/components/OntologyNetwork";

export const metadata: Metadata = {
  title: "Pali Ontology network",
  description: "A p5.js network of the Pali Ontology, with terms linked by their doctrinal relationships.",
};

export default function OntologyNetworkPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <OntologyNetwork />
    </div>
  );
}
