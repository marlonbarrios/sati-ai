import type { Metadata } from "next";
import Link from "next/link";
import { PaliOntology } from "@/components/PaliOntology";
import { PALI_ONTOLOGY_SOURCE } from "@/data/pali-ontology";

export const metadata: Metadata = {
  title: "Pali Ontology",
  description: "A Pali glossary and doctrinal map for Sati-AI, drawn from the public-domain Tipiṭaka lists.",
};

export default function PaliOntologyPage() {
  return (
    <div className="flex flex-col flex-grow items-center pt-10">
      <div className="px-5 md:w-2/3">
        <h1 className="my-6">
          <span className="block text-4xl font-bold">Pali Ontology</span>
        </h1>
        <p>
          This glossary is the Pali Ontology the conversation uses. The terms are in Pāli, with short English glosses
          written for this site, arranged as the early Buddhist map of experience. When a talk touches one of these
          words, that headword and gloss go with the question.{" "}
          <Link className="link" href="/pali-ontology/network">
            View the network
          </Link>
          .
        </p>
        <p>
          Download the glossary:{" "}
          <a className="link" href="/api/ontology/turtle">
            Turtle
          </a>
          ,{" "}
          <a className="link" href="/api/ontology/owl">
            OWL
          </a>
          ,{" "}
          <a className="link" href="/api/ontology/json">
            JSON
          </a>
          .
        </p>
        <p>{PALI_ONTOLOGY_SOURCE.summary}</p>
        <p>
          Further lookup:{" "}
          <a className="link" href={PALI_ONTOLOGY_SOURCE.further.href} target="_blank" rel="noreferrer">
            {PALI_ONTOLOGY_SOURCE.further.label}
          </a>
          . {PALI_ONTOLOGY_SOURCE.further.note} The suttas named above can be read on{" "}
          <a className="link" href={PALI_ONTOLOGY_SOURCE.canon.href} target="_blank" rel="noreferrer">
            {PALI_ONTOLOGY_SOURCE.canon.label}
          </a>
          .
        </p>
      </div>
      <PaliOntology />
    </div>
  );
}
