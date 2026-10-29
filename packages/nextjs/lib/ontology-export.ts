import {
  ONTOLOGY_GROUPS,
  PALI_ONTOLOGY,
  PALI_ONTOLOGY_SOURCE,
  STUDY_SOURCES,
  type OntologyEntry,
} from "@/data/pali-ontology";

const BASE = "https://marlonbarrios.github.io/sati-ontology";

function groupSlug(group: string) {
  return group
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function termIri(id: string) {
  return `${BASE}#${id}`;
}

function groupIri(group: string) {
  return `${BASE}#group-${groupSlug(group)}`;
}

function sourceIri(id: string) {
  return `${BASE}#source-${id}`;
}

function turtleLiteral(value: string, lang?: string) {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return lang ? `"${escaped}"@${lang}` : `"${escaped}"`;
}

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function knownSee(entry: OntologyEntry) {
  const ids = new Set(PALI_ONTOLOGY.map(item => item.id));
  return (entry.see ?? []).filter(id => ids.has(id));
}

export function ontologyTurtle() {
  const lines = [
    `@prefix sati: <${BASE}#> .`,
    `@prefix owl: <http://www.w3.org/2002/07/owl#> .`,
    `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`,
    `@prefix skos: <http://www.w3.org/2004/02/skos/core#> .`,
    `@prefix dct: <http://purl.org/dc/terms/> .`,
    ``,
    `<${BASE}> a owl:Ontology, skos:ConceptScheme ;`,
    `  rdfs:label ${turtleLiteral("Sati Pali Ontology", "en")} ;`,
    `  dct:description ${turtleLiteral(PALI_ONTOLOGY_SOURCE.summary, "en")} ;`,
    `  dct:creator ${turtleLiteral("Marlon Barrios Solano", "en")} ;`,
    `  owl:versionInfo "0.1.0" .`,
    ``,
  ];

  for (const group of ONTOLOGY_GROUPS) {
    lines.push(
      `<${groupIri(group)}> a owl:Class, skos:Collection ;`,
      `  rdfs:label ${turtleLiteral(group, "en")} ;`,
      `  skos:inScheme <${BASE}> .`,
      ``,
    );
  }

  for (const source of STUDY_SOURCES) {
    lines.push(
      `<${sourceIri(source.id)}> a dct:BibliographicResource ;`,
      `  dct:title ${turtleLiteral(source.title, "en")} ;`,
      `  dct:type ${turtleLiteral(source.kind, "en")} ;`,
      `  rdfs:seeAlso <${source.href}> ;`,
      `  rdfs:comment ${turtleLiteral(source.note, "en")} .`,
      ``,
    );
  }

  for (const entry of PALI_ONTOLOGY) {
    const related = knownSee(entry);
    const parts = [
      `<${termIri(entry.id)}> a owl:Class, skos:Concept ;`,
      `  skos:inScheme <${BASE}> ;`,
      `  rdfs:subClassOf <${groupIri(entry.group)}> ;`,
      `  skos:prefLabel ${turtleLiteral(entry.pali, "pi")} ;`,
      `  skos:prefLabel ${turtleLiteral(entry.gloss, "en")} ;`,
      `  skos:definition ${turtleLiteral(entry.definition, "en")} ;`,
    ];
    for (const alias of entry.aliases ?? []) {
      parts.push(`  skos:altLabel ${turtleLiteral(alias, "en")} ;`);
    }
    for (const id of related) {
      parts.push(`  skos:related <${termIri(id)}> ;`);
    }
    for (const id of entry.sources ?? []) {
      parts.push(`  dct:source <${sourceIri(id)}> ;`);
    }
    parts.push(`  rdfs:isDefinedBy <${BASE}> .`);
    lines.push(parts.join("\n"), ``);
  }

  return `${lines.join("\n").trim()}\n`;
}

export function ontologyOwl() {
  const conceptBlocks = PALI_ONTOLOGY.map(entry => {
    const labels = [
      `    <skos:prefLabel xml:lang="pi">${xmlEscape(entry.pali)}</skos:prefLabel>`,
      `    <skos:prefLabel xml:lang="en">${xmlEscape(entry.gloss)}</skos:prefLabel>`,
      `    <skos:definition xml:lang="en">${xmlEscape(entry.definition)}</skos:definition>`,
      `    <rdfs:subClassOf rdf:resource="${xmlEscape(groupIri(entry.group))}"/>`,
      `    <skos:inScheme rdf:resource="${BASE}"/>`,
    ];
    for (const alias of entry.aliases ?? []) {
      labels.push(`    <skos:altLabel xml:lang="en">${xmlEscape(alias)}</skos:altLabel>`);
    }
    for (const id of knownSee(entry)) {
      labels.push(`    <skos:related rdf:resource="${xmlEscape(termIri(id))}"/>`);
    }
    for (const id of entry.sources ?? []) {
      labels.push(`    <dct:source rdf:resource="${xmlEscape(sourceIri(id))}"/>`);
    }
    labels.push(`    <rdfs:isDefinedBy rdf:resource="${BASE}"/>`);
    return `  <owl:Class rdf:about="${xmlEscape(termIri(entry.id))}">\n${labels.join("\n")}\n  </owl:Class>`;
  });

  const groups = ONTOLOGY_GROUPS.map(
    group =>
      `  <owl:Class rdf:about="${xmlEscape(groupIri(group))}">\n    <rdfs:label xml:lang="en">${xmlEscape(group)}</rdfs:label>\n    <skos:inScheme rdf:resource="${BASE}"/>\n  </owl:Class>`,
  );

  const sources = STUDY_SOURCES.map(
    source => `  <dct:BibliographicResource rdf:about="${xmlEscape(sourceIri(source.id))}">
    <dct:title xml:lang="en">${xmlEscape(source.title)}</dct:title>
    <dct:type xml:lang="en">${xmlEscape(source.kind)}</dct:type>
    <rdfs:seeAlso rdf:resource="${xmlEscape(source.href)}"/>
    <rdfs:comment xml:lang="en">${xmlEscape(source.note)}</rdfs:comment>
  </dct:BibliographicResource>`,
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns:skos="http://www.w3.org/2004/02/skos/core#"
         xmlns:dct="http://purl.org/dc/terms/">
  <owl:Ontology rdf:about="${BASE}">
    <rdfs:label xml:lang="en">Sati Pali Ontology</rdfs:label>
    <dct:description xml:lang="en">${xmlEscape(PALI_ONTOLOGY_SOURCE.summary)}</dct:description>
    <dct:creator xml:lang="en">Marlon Barrios Solano</dct:creator>
    <owl:versionInfo>0.1.0</owl:versionInfo>
  </owl:Ontology>
${groups.join("\n")}
${sources.join("\n")}
${conceptBlocks.join("\n")}
</rdf:RDF>
`;
}

export function ontologyJson() {
  return `${JSON.stringify(
    {
      "@context": {
        "@vocab": `${BASE}#`,
        skos: "http://www.w3.org/2004/02/skos/core#",
        owl: "http://www.w3.org/2002/07/owl#",
        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
        dct: "http://purl.org/dc/terms/",
        id: "@id",
        type: "@type",
      },
      id: BASE,
      type: ["owl:Ontology", "skos:ConceptScheme"],
      title: "Sati Pali Ontology",
      description: PALI_ONTOLOGY_SOURCE.summary,
      creator: "Marlon Barrios Solano",
      version: "0.1.0",
      groups: ONTOLOGY_GROUPS.map(group => ({
        id: groupIri(group),
        type: ["owl:Class", "skos:Collection"],
        label: group,
      })),
      sources: STUDY_SOURCES.map(source => ({
        id: sourceIri(source.id),
        type: "dct:BibliographicResource",
        key: source.id,
        title: source.title,
        kind: source.kind,
        href: source.href,
        note: source.note,
      })),
      terms: PALI_ONTOLOGY.map(entry => ({
        id: termIri(entry.id),
        type: ["owl:Class", "skos:Concept"],
        key: entry.id,
        pali: entry.pali,
        gloss: entry.gloss,
        definition: entry.definition,
        group: entry.group,
        aliases: entry.aliases ?? [],
        see: knownSee(entry),
        sources: entry.sources ?? [],
      })),
    },
    null,
    2,
  )}\n`;
}
