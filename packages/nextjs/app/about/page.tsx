import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Sati-Ai",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-grow items-center pt-10">
      <div className="px-5 md:w-1/2">
        <h1 className="my-6">
          <span className="block text-4xl font-bold">What is Sati-Ai?</span>
        </h1>
        <p>
          Sati-AI is a guide to the Pāli world of the Theravada tradition. The conversation is about Buddhist thought:
          the words, the discourses, and how early Buddhism understands experience. A wise scholar of these texts
          explains a teaching in its own terms, and can also guide meditation from that teaching. A human teacher is
          still the one to learn with in person.
        </p>
        <p>
          The Pāli word <b>sati</b> means remembering, or recollection. In the Theravada discourses it is the act of
          keeping a teaching in mind while knowing what is present. Mindfulness is one English translation of that word.
          The name of this project points back to it.
        </p>
        <p>
          As an art and research project, Sati-AI should be approached with an open and discerning mindset. It may
          contain inaccuracies or produce unexpected responses. When interacting with LLMs like Sati-AI, privacy and
          personal data protection are crucial considerations. Exercise caution with the information you disclose and
          refrain from providing sensitive personal data.
        </p>
        <p>
          There is also <Link className="font-bold underline" href="/remember">Remember</Link>, a short poem in Pāli and English drawn from the three marks.
        </p>
        <p>
          I dedicate this project with respect and gratitude to all my teachers in an interdisciplinary and non-linear
          assemblage of entanglements.
        </p>
        <h1 className="my-6">
          <span className="block text-4xl font-bold">Why Sati-Ai?</span>
        </h1>
        <p>Greetings!</p>
        <p>
          My name is Marlon Barrios Solano, and I am the artist and developer behind Sati-AI. I have been ably assisted
          by a dear friend, Andy Tudhope, in the implementation of this work.
        </p>
        <p>
          I greatly appreciate the versatility and range of Large Language Models (LLMs) and their ability to defy
          hyper-specialization. I savor the liminal space of a conversation with Sati-AI, and the knowledge that appears
          there, inside the unstable interdisciplinary landscapes that I like to inhabit.
        </p>
        <p>
          Sati-AI is a way into the Pāli thought-world, and it also carries my interdisciplinary research path, including
          my own Vipassana practice and life. My art and research traverses cognitive science, dance improvisation and choreography,
          contemplative practices, art and technology and software development. In Sati-AI, early Buddhist knowledge is
          an attractor. Sati-AI is imagined as an embodiment of the distributed, uncertain, and queer condition of not
          having a center, a rigor necessitated by the state of knowing not knowing. Sati-AI is a reminder of the
          primacy of embodiment, art and paradoxes.
        </p>
        <p>
          To stay in conversation with this thought-world, I made Sati-AI a guide to the words, the discourses, and the way
          early Buddhism understands experience. A short meditation belongs there only when it comes from a teaching. A
          human teacher is still the one to learn with in person.
        </p>
        <p>I keep this account of wisdom beside the project:</p>
        <p className="border-l-4 border-slate-400 pl-8 italic">
          &ldquo;Intelligence is necessary but not sufficient for wisdom. Intelligence is needed for the survival of
          homo sapiens, but wisdom is critical for thriving in the modern society. Wisdom is potentially more
          modifiable than IQ, and unlike IQ, may increase with age and experience. AI technologies of the future will
          require new conceptual and computational models based on human wisdom and not human intelligence, to produce
          AW. An AW agent can serve as an assistant, peer, or coach. It can help make humans wiser. A long-term
          transdisciplinary collaboration is essential for development of AW, which will have far greater positive
          impact on human well-being than any technology developed to date.&rdquo;
        </p>
        <p>
          from the paper{" "}
          <a
            className="font-bold underline"
            href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7942180/"
            target="_blank"
            rel="noreferrer"
          >
            Beyond Artificial Intelligence (AI): Exploring Artificial Wisdom (AW) Jeste et all. 2020
          </a>
        </p>
        <p>
          I hope that you enjoy your conversations with Sati-AI. I am always open to feedback and suggestions. Please
          feel free to reach out to me at marlon(at)dance-tech.net.
        </p>
        <p>I know for sure that Sati-AI is empty of a separate self. So are we.</p>
      </div>
      <div className="mx-auto w-80 items-center">
        <Image src="/logo.png" alt="Sati-AI" width={1630} height={1094} style={{ width: "100%", height: "auto" }} />
      </div>
    </div>
  );
}
