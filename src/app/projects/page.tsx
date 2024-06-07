import React from "react";
import { Card, CardBody, CardFooter, Image } from "@nextui-org/react";

function Projects() {
  const fullStack = [
    {
      title: "Next JS",
      img: "/images/next.png",
    },
    {
      title: "Laravel",
      img: "/images/laravel.png",
    },
    {
      title: "Remix JS",
      img: "/images/remix.png",
    },
    {
      title: "Nest JS",
      img: "/images/nest.png",
    },
  ];
  const styleCss = [
    {
      title: "Bootstrap",
      img: "/images/2.png",
    },
    {
      title: "Tailwind",
      img: "/images/1.png",
    },
    {
      title: "ShadCn",
      img: "/images/3.png",
    },
    {
      title: "Next UI",
      img: "/images/4.png",
    },
  ];
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24 bg-zinc-900  lg:ml-64">
      <h2 className="text-3xl font-bold text-purple-500 pb-5">Projects</h2>
      <section className="border-1 border-red-500 bg-black rounded-xl">
        <p className="text-white text-xl text-center pt-5 red-running-text">Full Stack</p>
        <div className="px-36">
          <hr className="border-t border-red-500 w-full red-running-border px-5" />
        </div>
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-4 p-5">
          {fullStack.map((item, index) => (
            <Card shadow="sm" key={index} className="border-1 border-red-500 bg-transparent">
              <CardBody className="overflow-visible p-0">
                <Image shadow="sm" radius="lg" width="100%" alt={item.title} className="w-full object-cover h-[200px] bg-white" src={item.img} />
              </CardBody>
              <CardFooter className="text-small justify-center">
                <p className="text-red-500 drop-shadow-xl">{item.title}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      <section className="border-1 border-indigo-500 bg-black rounded-xl">
        <p className="text-indigo-500 text-xl py-5 text-center">Style</p>
        <div className="px-36">
          <hr className="border-t border-red-500 w-full red-running-border px-5" />
        </div>
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-4 p-5">
          {styleCss.map((item, index) => (
            <Card shadow="sm" key={index} className="border-1 border-purple-500 bg-transparent">
              <CardBody className="overflow-visible p-0">
                <Image shadow="sm" radius="lg" width="100%" alt={item.title} className="w-full object-cover h-[200px] bg-white" src={item.img} />
              </CardBody>
              <CardFooter className="text-small justify-center">
                <p className="text-indigo-500 drop-shadow-xl">{item.title}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Projects;
