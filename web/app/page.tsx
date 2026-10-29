import Image from "next/image";
import Link from "next/link";
import { MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Chat } from "@/components/chat/Chat";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ term?: string }> }) {
  const { term } = await searchParams;
  return (
    <div className="flex flex-col flex-grow items-center pt-10">
      <div className="px-5 md:w-1/2">
        <div className="float-left">
          <h1 className="mb-8 mr-10 text-center">
            <span className="block text-4xl font-bold">Sati-Ai</span>
          </h1>
        </div>
        <div className="float-right">
          <Image src="/logo.png" alt="Sati-AI" width={1630} height={1094} style={{ width: 100, height: "auto" }} />
        </div>
      </div>

      <div className="px-5 md:w-1/2">
        <p className="text-lg">
          Sati-AI is a guide to the Pāli world of the Theravada tradition. The conversation is about Buddhist thought:
          the words, the discourses, and how early Buddhism understands experience.
        </p>
        <p className="text-lg">
          A wise scholar of these texts explains a teaching in its own terms, and can also guide meditation from that
          teaching. A human teacher is still the one to learn with in person.
        </p>
        <h1 className="my-6">
          <span className="block text-4xl font-bold">May you be free from suffering...</span>
        </h1>
      </div>

      <div className="px-5 md:w-1/2">
        <Chat topicId={term} />
      </div>

      <div className="px-5 md:w-1/2">
        <p>
          Sati-AI answers from a Buddhist teacher prompt and from the Pali Ontology, a glossary of early Buddhist terms
          in Pāli with short English glosses written for this site. When a conversation touches one of those words, that
          headword and gloss go with the question.
        </p>
      </div>

      <div className="mt-16 w-full flex-grow bg-base-300 px-8 py-12">
        <div className="text-center">
          <p className="text-4xl">In the Media</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-12 sm:flex-row">
          <div className="flex max-w-xs flex-col items-center rounded-3xl bg-base-100 px-10 py-10 text-center">
            <SparklesIcon className="h-8 w-8 fill-secondary" />
            <p>
              Remembering to Remember:{" "}
              <Link
                href="https://we.scienceandnonduality.com/podcasts/sounds-of-sand/episodes/2148045015"
                className="link"
              >
                Science and Nonduality Podcast
              </Link>{" "}
              with Marlon Barrios Solano.
            </p>
          </div>
          <div className="flex max-w-xs flex-col items-center rounded-3xl bg-base-100 px-10 py-10 text-center">
            <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
            <p>
              An interview in{" "}
              <Link href="https://www.lionsroar.com/ai-meditation-teacher/" className="link">
                Lion&apos;s Roar Magazine
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
