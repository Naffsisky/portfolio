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
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      <h2 className="text-3xl font-bold text-purple-500 pb-5">Projects</h2>
      <section className="py-5">
        <div className="flex items-center justify-center flex-wrap">
          <button
            type="button"
            className="text-blue-700 hover:text-white border border-blue-600 bg-white hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:bg-gray-900 dark:focus:ring-blue-800"
          >
            All categories
          </button>
          <button
            type="button"
            className="text-gray-900 border border-white hover:border-gray-200 dark:border-gray-900 dark:bg-gray-900 dark:hover:border-gray-700 bg-white focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3 dark:text-white dark:focus:ring-gray-800"
          >
            Full Stack
          </button>
          <button
            type="button"
            className="text-gray-900 border border-white hover:border-gray-200 dark:border-gray-900 dark:bg-gray-900 dark:hover:border-gray-700 bg-white focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3 dark:text-white dark:focus:ring-gray-800"
          >
            Backend
          </button>
          <button
            type="button"
            className="text-gray-900 border border-white hover:border-gray-200 dark:border-gray-900 dark:bg-gray-900 dark:hover:border-gray-700 bg-white focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3 dark:text-white dark:focus:ring-gray-800"
          >
            Cloud Computing
          </button>
          <button
            type="button"
            className="text-gray-900 border border-white hover:border-gray-200 dark:border-gray-900 dark:bg-gray-900 dark:hover:border-gray-700 bg-white focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3 dark:text-white dark:focus:ring-gray-800"
          >
            Automation
          </button>
        </div>
        <div className="flex flex-col justify-center items-center">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border-2 border-white rounded-lg">
              <Image className="h-auto max-w-full rounded-lg" src="/images/nextx.png" alt="" width={200} height={200} />
              <hr/>
              <div className="flex flex-col justify-center items-center">
                <a href="#" className="text-white">
                  Next
                </a>
              </div>
              <p className="text-white">Program ini dibuat dengan Next Program ini dibuat dengan Next Program ini dibuat dengan Next</p>
            </div>
            <div className="border-2 border-white rounded-lg">
              <Image className="h-auto max-w-full rounded-lg" src="/images/dummy-1.jpeg" alt="" width={200} height={200} />
            </div>
            <div className="border-2 border-white rounded-lg">
              <Image className="h-auto max-w-full rounded-lg" src="/images/dummy-1.jpeg" alt="" width={200} height={200} />
            </div>
          </div>
        </div>
      </section>
      <section className="border-1 border-red-500 bg-black rounded-xl">
        <p className="text-white text-xl text-center pt-5 red-running-text">Full Stack</p>
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-4 p-5">
          {fullStack.map((item, index) => (
            <Card shadow="sm" key={index} className="border-1 border-red-500 bg-transparent">
              <CardBody className="overflow-visible p-0">
                <Image shadow="sm" radius="lg" width="100%" alt={item.title} className="object-fit h-[100px] w-[100px] bg-white" src={item.img} />
              </CardBody>
              <CardFooter className="text-small justify-center">
                <p className="text-red-500 drop-shadow-xl hover:text-white">{item.title}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      <br />
      <section className="border-1 border-indigo-500 bg-black rounded-xl">
        <p className="text-indigo-500 text-xl py-5 text-center indigo-running-text">Style</p>
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-4 p-5">
          {styleCss.map((item, index) => (
            <Card shadow="sm" key={index} className="border-1 border-purple-500 bg-transparent">
              <CardBody className="overflow-visible p-0">
                <Image shadow="sm" radius="lg" width="100%" alt={item.title} className="object-fit h-[100px] w-[100px] bg-white" src={item.img} />
              </CardBody>
              <CardFooter className="text-small justify-center">
                <p className="text-indigo-500 drop-shadow-xl hover:text-white">{item.title}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Projects;
