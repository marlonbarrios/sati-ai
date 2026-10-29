import { SwitchTheme } from "@/components/SwitchTheme";

export const Footer = () => {
  return (
    <div className="min-h-0 mb-11 p-5 lg:mb-0">
      <div className="pointer-events-none fixed bottom-0 left-0 z-20 flex w-full p-4">
        <SwitchTheme className="pointer-events-auto" />
      </div>
      <p className="m-0 text-center text-sm">
        Concept and programming by{" "}
        <a
          href="https://marlonbarrios.github.io/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Marlon Barrios Solano
        </a>
      </p>
    </div>
  );
};
