"use client";

import { Sparkles } from "@/components/Sparkles";
import Typewriter from "typewriter-effect";
import Photos from "@/components/Photos";
import Marquee from "@/components/Marquee";
import Experience from "@/components/Experience";
import TechLogo from "@/components/TechLogo";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-900 lg:ml-64">
      <section className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-between border-2 rounded-2xl p-10 shadow-2xl shadow-indigo-500">
          <div className="lg:text-3xl text-xl font-bold text-purple-500" id="typewriter">
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

          <div className="overflow-hidden">
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
        </div>
      </section>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path
          fill="18181B"
          fillOpacity="1"
          d="M0,320L40,288C80,256,160,192,240,138.7C320,85,400,43,480,69.3C560,96,640,192,720,202.7C800,213,880,139,960,138.7C1040,139,1120,213,1200,218.7C1280,224,1360,160,1400,128L1440,96L1440,0L1400,0C1360,0,1280,0,1200,0C1120,0,1040,0,960,0C880,0,800,0,720,0C640,0,560,0,480,0C400,0,320,0,240,0C160,0,80,0,40,0L0,0Z"
        ></path>
      </svg>

      <section className="lg:px-20">
        <div className="flex flex-col justify-center items-center pb-5">
            <span className="absolute py-4 flex border bg-gradient-to-r blur-xl from-blue-500 via-teal-500 to-pink-500 bg-clip-text text-5xl box-content font-extrabold text-transparent text-center select-none">
              Introduction
            </span>
            <h1 className="py-4 justify-center flex bg-gradient-to-r items-center from-blue-500 via-teal-500 to-pink-500 bg-clip-text text-5xl font-extrabold text-transparent text-center select-auto">
              Introduction
            </h1>
        </div>
        <div className="border-2 border-blue-500 rounded-lg bg-slate-900">
          <div className="p-3">
            <h3 className="text-2xl font-bold text-indigo-500 text-center">SUMMARY</h3>
            <p className="text-white text-justify py-3">
              As a final-year undergraduate Computer Science student at National Veteran Development University East Java, I am deeply passionate about both Cyber and Network Security, Cloud Engineering as well as Software Engineering. I
              have a strong interest in protecting systems, managing systems, design system and system analysis from potential threats. I am dedicated to expanding my knowledge and gaining valuable experience to further my professional
              growth.
            </p>
          </div>
        </div>
      </section>

      <section className="lg:px-20">
        <div className="py-5">
          <h3 className="text-2xl font-bold text-indigo-500 text-center pb-5">EXPERIENCE</h3>
          <div className="px-3">
            <Experience />
          </div>
        </div>
      </section>
      <section className="flex flex-col items-center justify-between py-5 px-3">
        <h2 className="text-2xl font-bold text-indigo-500 pb-2">GALLERY</h2>
        <p className="text-sm text-white pb-5">Swipe left!</p>
        <Photos />
      </section>
      <section className="flex flex-col items-center justify-between py-5 px-3">
        <h2 className="text-2xl font-bold text-indigo-500 pb-5">LEARNING COMPANY</h2>
        <Marquee />
      </section>

      <section className="flex flex-col items-center justify-between py-5 px-3">
        <h2 className="text-2xl font-bold text-indigo-500 pb-5">TECH STACK</h2>
        <TechLogo />
      </section>

      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path
          fill="18181B"
          fillOpacity="1"
          d="M0,64L48,53.3C96,43,192,21,288,21.3C384,21,480,43,576,69.3C672,96,768,128,864,128C960,128,1056,96,1152,69.3C1248,43,1344,21,1392,10.7L1440,0L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </main>
  );
}
