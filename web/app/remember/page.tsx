import type { Metadata } from "next";
import { RememberStudio } from "@/components/RememberStudio";

export const metadata: Metadata = {
  title: "Remember",
};

export default function RememberPage() {
  return (
    <div className="flex flex-col flex-grow items-center pt-10">
      <div className="px-5 md:w-1/2">
        <h1 className="my-6">
          <span className="block text-4xl font-bold">Remember</span>
        </h1>
        <p>
          Remember is a short poem in Pāli and English, drawn from the three marks. It sits beside the talk: a way of
          looking at how early Buddhism understands experience.
        </p>
        <ul className="list-disc px-8 font-bold">
          <li>anicca, impermanence</li>
          <li>dukkha, unsatisfactoriness</li>
          <li>anattā, not-self</li>
        </ul>
        <p>
          Each visit makes a new poem and a new image. They are not kept. A human teacher is still the one to learn with
          in person.
        </p>
      </div>
      <RememberStudio />
    </div>
  );
}
