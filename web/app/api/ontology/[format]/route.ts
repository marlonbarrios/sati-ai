import { ontologyJson, ontologyOwl, ontologyTurtle } from "@/lib/ontology-export";

const FORMATS = {
  turtle: {
    body: ontologyTurtle,
    type: "text/turtle; charset=utf-8",
    filename: "sati-pali-ontology.ttl",
  },
  owl: {
    body: ontologyOwl,
    type: "application/rdf+xml; charset=utf-8",
    filename: "sati-pali-ontology.owl",
  },
  json: {
    body: ontologyJson,
    type: "application/ld+json; charset=utf-8",
    filename: "sati-pali-ontology.json",
  },
} as const;

type FormatName = keyof typeof FORMATS;

export function GET(_request: Request, context: { params: Promise<{ format: string }> }) {
  return context.params.then(({ format }) => {
    const spec = FORMATS[format as FormatName];
    if (!spec) {
      return Response.json({ error: "Use turtle, owl, or json." }, { status: 404 });
    }
    return new Response(spec.body(), {
      headers: {
        "Content-Type": spec.type,
        "Content-Disposition": `attachment; filename="${spec.filename}"`,
      },
    });
  });
}
