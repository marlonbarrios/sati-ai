import { Layout, Text, Page } from '@vercel/examples-ui'
import { Chat } from '../components/Chat'
import Link from 'next/link';

function Home() {
  return (
    <Page className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <Text variant="h1">Bhikkh-AI</Text>
        <Text className="text-zinc-600">
         Introducing Bhikkh-AI, an AI-powered Buddhist meditation guide that can answer all your questions about mindfulness meditation 
          and early Buddhist concepts and philosophy. This innovative tool is <b>multilingual</b>, so you can receive guidance on your meditation 
          practice in various languages. Simply ask anything related to mindfulness and early Buddhism, and the chatbot will provide you with wise and reliable guidance. Experience the benefits of having a meditation guide right at your fingertips, wherever and whenever you need it.
        </Text>
          <Text className="text-zinc-600">
        <i>Bhikkh-AI, powered by a large AI language model, aims to support your meditation practice but is not meant to replace knowledgeable human teachers, friends, or mental health professionals.</i>
        </Text>
      
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="h2">May you be free from suffering...</Text>
        <div className="lg:w-2/3">
          <Chat />
           <Text className="text-zinc-600">Concept, programming and promp engineering by <Link href="https://marlonbarrios.github.io/">Marlon Barrios Solano</Link></Text>
        </div>
      </section>
    </Page>
  )
}

Home.Layout = Layout

export default Home
