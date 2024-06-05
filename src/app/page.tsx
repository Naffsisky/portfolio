"use client";

import { Sparkles } from "@/components/Sparkles";
import "./script.js";
import Typewriter from "typewriter-effect";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-zinc-900">
      <div className="text-3xl font-bold text-purple-500" id="typewriter">
        <Typewriter
          onInit={(typewriter) => {
            typewriter
              .typeString("Hello World!")
              .callFunction(() => {
                console.log("String typed out!");
              })
              .pauseFor(2500)
              .deleteAll()
              .callFunction(() => {
                console.log("All strings were deleted");
              })
              .start();
          }}
        />{" "}
      </div>

      <div className="h-screen w-screen overflow-hidden">
        <div className="mx-auto mt-32 w-screen max-w-2xl">
          <div className="text-center text-3xl text-white">
            <span className="text-indigo-200">Trusted by experts.</span>

            <br />

            <span>Used by the leaders.</span>
          </div>
        </div>

        <div className="relative -mt-32 h-96 w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#8350e8,transparent_70%)] before:opacity-40 after:absolute after:-left-1/2 after:top-1/2 after:aspect-[1/0.7] after:w-[200%] after:rounded-[100%] after:border-t after:border-[#7876c566] after:bg-zinc-900">
          <Sparkles density={1200} className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]" />
        </div>
      </div>
    </main>
  );
}
