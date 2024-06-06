"use client";

import { Sparkles } from "@/components/Sparkles";
import Typewriter from "typewriter-effect";

export default function Home() {
  return (
    <main className="min-h-screen p-20 bg-zinc-900 ml-64">
      <section className="flex flex-col items-center justify-between">
        <div className="text-3xl font-bold text-purple-500" id="typewriter">
          <Typewriter
            onInit={(typewriter) => {
              typewriter.typeString("Hello World!").pauseFor(3000).deleteAll().typeString("My name is Prinafsika").pauseFor(3000).deleteAll().start();
            }}
            options={{
              autoStart: true,
              loop: true,
            }}
          />{" "}
        </div>

        <div className="h-screen overflow-hidden">
          <div className="mx-auto mt-32 max-w-2xl">
            <div className="text-center text-3xl text-white">
              <span className="text-indigo-200">I&apos;m a</span> <span className="text-indigo-500">Full Stack Developer</span>
              <br />
              <span>and a</span>{" "}
              <span className="text-indigo-500">
                <span className="text-[#8350e8]">Human</span> Software Engineer.
              </span>
            </div>
          </div>

          <div className="relative -mt-32 h-96 overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#8350e8,transparent_70%)] before:opacity-40 after:absolute after:-left-1/2 after:top-1/2 after:aspect-[1/0.7] after:w-[200%] after:rounded-[100%] after:border-t after:border-[#7876c566] after:bg-zinc-900">
            <Sparkles density={1200} className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]" />
          </div>
        </div>
      </section>
      <section className="border-2 border-indigo-500 rounded-lg">
        <div>
          <p>Hola!</p>
        </div>
      </section>
    </main>
  );
}
