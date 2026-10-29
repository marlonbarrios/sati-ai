# Sati-AI

A guide to the Pāli world of the Theravada tradition. The conversation is about Buddhist thought: the words, the discourses, and how early Buddhism understands experience. A wise scholar of these texts explains a teaching in its own terms, and can also guide a short meditation from that teaching. A human teacher is still the one to learn with in person.

Sati answers from a Buddhist teacher prompt and from the Pali Ontology. When a conversation touches one of those words, that headword and its English gloss go with the question. The glosses were written for this site. They are not copied from a copyrighted dictionary.

There is no wallet, contract, or NFT minting in this app.

## Pages

- **Talk**, on the home page. Voice is on by default, in the Echo voice, a little slower than the model's usual pace. The menu also offers alloy, ash, ballad, coral, sage, shimmer, verse, marin, and cedar. Voice can be turned off for typing. Hold the space bar or Hold to talk to speak. A conversation can be saved as a PDF or as an audio file.
- **About**. What Sati is, and why it was made.
- **Pali Ontology**. The glossary, with the network of terms beside it.
- **Remember**. A short poem in Pāli and English drawn from the three marks, with a new image each visit. The poem and the image are not kept.

## Requirements

- [Node.js 20+](https://nodejs.org/en/download/)

## Get started

```bash
npm install
```

Put your OpenAI key in `web/.env.local`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-6-luna
OPENAI_REALTIME_MODEL=gpt-realtime-2.1
OPENAI_IMAGE_MODEL=gpt-image-1-mini
```

The talk uses the realtime model. Remember uses the text model and the image model.

Start the app:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Pali Ontology files

The glossary in `web/data/pali-ontology.ts` is the source. It currently holds 130 terms. The same glossary is served live:

- [Turtle](http://localhost:3000/api/ontology/turtle)
- [OWL](http://localhost:3000/api/ontology/owl)
- [JSON](http://localhost:3000/api/ontology/json)

Copies of that export are kept in `web/ontology/`:

- `sati-pali-ontology.ttl`
- `sati-pali-ontology.owl`
- `sati-pali-ontology.json`

Those three files match the glossary, including upekkhā among the divine abidings and the later headwords for craving, liberation, and knowledge and vision according to reality.
