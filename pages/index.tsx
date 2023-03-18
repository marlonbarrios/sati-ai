import { Layout, Text, Page } from '@vercel/examples-ui'
import { Chat } from '../components/Chat'
import Link from 'next/link';


function Home() {
  return (
    <Page className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">

        <Text variant="h1">Bhikkh-AI</Text>
        <Text className="text-zinc-600">Introducing Bhikkh-AI, an AI-powered Buddhist meditation guide that can answer all your questions about mindfulness meditation and early Buddhist concepts and philosophy. This innovative tool is <b>multilingual</b>, so you can receive guidance on your meditation 
practice in various languages. Simply ask anything related to mindfulness and early Buddhism, and the chatbot will provide you with wise and reliable guidance. Experience the benefits of having a meditation guide right at your fingertips, wherever and whenever you need it.</Text>
         <Text className="text-zinc-600"><i>Bhikkh-AI, powered by a large AI language model, aims to support your meditation practice but is not meant to replace knowledgeable human teachers, friends, or mental health professionals.</i></Text>
        
         <Text className="text-zinc-600"><i>Bhikkh-AI is envisioned as a digital art project, and like anything else, it should be approached with an open yet critical mind. It may have inaccuracies and may occasionally respond in unexpected ways.</i></Text>
       
         <Text className="text-zinc-600"><i> When interacting with Large Learning Models (LLMs), such as this one, privacy and personal data are important considerations. While LLMs are designed to provide users with accurate and helpful responses to their queries, it is important to ensure that any personal information shared during interactions is protected. To address this concern, LLMs like Bhikkh-AI uses advanced encryption and anonymization techniques to protect users' interactions. Additionally, Bhikkh-AI does not store any personal information, ensuring that all interactions with it are private and secure. However, users should still be mindful of the information they share and avoid providing sensitive personal data to LLMs or any other digital platforms to ensure their privacy and security. Enjoy...</Text>
      </section>
      <section className="flex flex-col gap-3">
        <Text variant="h2">May you be free from suffering...</Text>
        <div className="lg:w-2/3">
          <Chat />
             <Text className="text-zinc-600"><i>If any of my previous responses seemed incomplete, please type <b>continue</b>, and I will do my best to expand or clarify my previous statements.</i></Text>
        </div>
        <Text className="text-zinc-600"><b>This project is dedicated with respect and gratitude to all my teachers</b></Text>
     <Text className="text-zinc-600">Concept, programming and prompt engineering by <Link href="https://marlonbarrios.github.io/">Marlon Barrios Solano</Link></Text>
         <Text className="text-zinc-600">Powered by <Link href="https://openai.com/product/gpt-4">GPT-4/OpenAI</Link></Text>
        
           <Text className="text-zinc-600"> <Link href="https://patreon.com/user?u=84024387&utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=creatorshare_creator&utm_content=join_linkv">Support my work in Patreon</Link></Text>
      </section>
    </Page>
  )
}



export default Home
