import React from "react";
import { Card, CardBody, CardFooter, Image } from "@nextui-org/react";

function Projects() {
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
            <div className="border-2 border-white rounded-lg">
              <Image className="h-auto max-w-full rounded-lg" src="/images/nextx.png" alt="" width={200} height={200} />
              <hr />
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
    </div>
  );
}

export default Projects;
