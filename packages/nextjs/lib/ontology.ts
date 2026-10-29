import { ONTOLOGY_GROUPS, PALI_ONTOLOGY, type OntologyEntry } from "@/data/pali-ontology";

export { ONTOLOGY_GROUPS, PALI_ONTOLOGY };
export type { OntologyEntry };

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function hasTerm(haystack: string, term: string) {
  const needle = fold(term).trim();
  if (needle.length < 4) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(haystack);
}

export function searchOntology(query: string, group?: string) {
  const folded = fold(query.trim());
  return PALI_ONTOLOGY.filter(entry => {
    if (group && entry.group !== group) return false;
    if (!folded) return true;
    const fields = [entry.pali, entry.gloss, entry.definition, ...(entry.aliases ?? [])];
    return fields.some(field => fold(field).includes(folded));
  });
}

export function ontologyById(id: string) {
  return PALI_ONTOLOGY.find(entry => entry.id === id);
}

export function ontologyContextFor(text: string) {
  const haystack = fold(text);
  const hits: OntologyEntry[] = [];

  for (const entry of PALI_ONTOLOGY) {
    const terms = [entry.pali, entry.gloss, ...(entry.aliases ?? [])];
    if (terms.some(term => hasTerm(haystack, term))) hits.push(entry);
    if (hits.length >= 12) break;
  }

  if (hits.length === 0) return "";

  const lines = hits.map(entry => `- ${entry.pali} (${entry.gloss}): ${entry.definition}`);
  return `Pali Ontology. Use these headwords and glosses when they bear on the reply. Do not invent a different translation for them.\n${lines.join("\n")}`;
}
