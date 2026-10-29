"use client";

import { useEffect, useMemo, useState } from "react";
import { ONTOLOGY_GROUPS, searchOntology, ontologyById } from "@/lib/ontology";

export function PaliOntology() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const entries = useMemo(() => searchOntology(query, group || undefined), [query, group]);

  useEffect(() => {
    if (!pendingId) return;
    document.getElementById(pendingId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPendingId(null);
  }, [pendingId, entries]);

  return (
    <div className="w-full px-5 md:w-2/3">
      <input
        type="search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Search Pali or English, for example sati or mindfulness"
        aria-label="Search the Pali ontology"
        className="mb-4 w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-base-content shadow-md placeholder:text-base-content/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn btn-sm ${group === "" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setGroup("")}
        >
          All
        </button>
        {ONTOLOGY_GROUPS.map(name => (
          <button
            key={name}
            type="button"
            className={`btn btn-sm ${group === name ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setGroup(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <p className="text-sm">{entries.length} entries</p>
      <div className="flex flex-col gap-4 pb-10">
        {entries.map(entry => (
          <article key={entry.id} id={entry.id} className="rounded-2xl bg-base-100 px-5 py-4 shadow">
            <p className="mb-1 text-sm uppercase tracking-wide">{entry.group}</p>
            <h2 className="text-2xl font-bold">{entry.pali}</h2>
            <p className="mt-1 font-semibold">{entry.gloss}</p>
            <p>{entry.definition}</p>
            {entry.see && entry.see.length > 0 && (
              <p className="text-sm">
                See also:{" "}
                {entry.see.map((id, index) => {
                  const related = ontologyById(id);
                  if (!related) return null;
                      return (
                    <span key={id}>
                      {index > 0 ? ", " : ""}
                      <button
                        type="button"
                        className="link"
                        onClick={() => {
                          setQuery("");
                          setGroup("");
                          setPendingId(id);
                        }}
                      >
                        {related.pali}
                      </button>
                    </span>
                  );
                })}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
