"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardFooter, Image } from "@nextui-org/react";
import Link from "next/link";
import LoadingAnimation from "@/components/AnimationLoading";

function Projects() {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      <h2 className="text-3xl font-bold text-purple-500 pb-5">Projects</h2>
      <div className="py-5">
        <section>
          <div className="flex items-center justify-center flex-wrap">
            <button type="button" className="text-white border border-neutral-500 hover:border-white bg-neutral-400 focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3">
              All categories
            </button>
            <button type="button" className="text-white border border-red-500 hover:border-white bg-red-400 focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3">
              Full Stack
            </button>
            <button type="button" className="text-white border border-teal-500 hover:border-white bg-teal-400 focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3">
              Frontend
            </button>
            <button type="button" className="text-white border border-purple-500 hover:border-white bg-purple-400 focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3">
              Backend
            </button>
            <button type="button" className="text-white border border-sky-500 hover:border-white bg-sky-400 focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3">
              DevOps
            </button>
            <button type="button" className="text-white border border-yellow-500 hover:border-white bg-yellow-400 focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3">
              UI/UX
            </button>
          </div>
        </section>
        <section className="mt-10">
          <div className="max-w-[900px] gap-4 grid grid-cols-12 grid-rows-2 px-8">
            <Link href="https://www.figma.com/design/IpnKOro0C1yxjI5y1oHJgQ/KuliKu?node-id=0-1&t=KZZajgk0Ab7vqdSa-1" target="_blank" className="col-span-12 sm:col-span-4 h-[400px]">
              <Card className="col-span-12 sm:col-span-4 h-[400px] hover:scale-105 border-2 border-yellow-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <div className="pb-3">
                    <p className="text-md text-black/60 uppercase font-bold border border-yellow-500 bg-yellow-400 px-5 py-1 rounded-full">UI/UX</p>
                  </div>
                  {isLoading ? (
                    <div className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-yellow-400 animate-pulse">
                      <LoadingAnimation />
                    </div>
                  ) : (
                    <Image removeWrapper alt="Card background" className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-yellow-400 transition-opacity duration-500" src="/images/projects/kuliku.png" />
                  )}
                  <h4 className="text-zinc-600 font-medium text-large pt-2">KuliKu Design</h4>
                  <small className="text-slate-700 text-justify">
                    Design ini dibuat untuk memenuhi tugas matakuliah UI/UX. KuliKu adalah sebuah aplikasi pihak ke 3 atau yang bertugas sebagai midman atau penengah antara pekerja dan client.
                  </small>
                </CardHeader>
                <Image removeWrapper alt="Card background" className={`z-0 w-full h-full object-cover blur-sm ${isLoading ? "hidden" : "block"}`} src="/images/projects/kuliku.png" onLoad={() => setIsLoading(false)} />
              </Card>
            </Link>
            <Link href="https://www.figma.com/design/GGBxPByiMaBTEdSya9zw5y/MITA-Apps?node-id=0-1&t=uMDN3JPO9X0HOBHj-1" target="_blank" className="col-span-12 sm:col-span-4 h-[400px]">
              <Card className="col-span-12 sm:col-span-4 h-[400px] hover:scale-105 border-2 border-yellow-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <div className="pb-3">
                    <p className="text-md text-black/60 uppercase font-bold border border-yellow-500 bg-yellow-400 px-5 py-1 rounded-full">UI/UX</p>
                  </div>
                  {isLoading ? (
                    <div className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-yellow-400 animate-pulse">
                      <LoadingAnimation />
                    </div>
                  ) : (
                    <Image removeWrapper alt="Card background" className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-yellow-400 transition-opacity duration-500" src="/images/projects/mita-ui.png" />
                  )}
                  <h4 className="text-zinc-600 font-medium text-large pt-2">MITA Mobile App</h4>
                  <small className="text-slate-700 text-justify">MITA adalah sebuah project capstone dari Bangkit Academy. Design ini dibuat sebagai wireframe dari aplikasi MITA Mobile.</small>
                </CardHeader>
                <Image removeWrapper alt="Card background" className={`z-0 w-full h-full object-cover blur-sm ${isLoading ? "hidden" : "block"}`} src="/images/projects/mita-ui.png" onLoad={() => setIsLoading(false)} />
              </Card>
            </Link>
            <Link href="http://prinafsika.world:8080" target="_blank" className="col-span-12 sm:col-span-4 h-[400px]">
              <Card className="col-span-12 sm:col-span-4 h-[400px] hover:scale-105 border-2 border-sky-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <div className="pb-3">
                    <p className="text-md text-black/60 uppercase font-bold border border-sky-500 bg-sky-400 px-5 py-1 rounded-full">DevOps</p>
                  </div>
                  {isLoading ? (
                    <div className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-sky-400 animate-pulse">
                      <LoadingAnimation />
                    </div>
                  ) : (
                    <Image removeWrapper alt="Card background" className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-sky-400 transition-opacity duration-500" src="/images/projects/jenkins.png" />
                  )}
                  <h4 className="text-zinc-600 font-medium text-large pt-2">Jenkins Automation</h4>
                  <small className="text-slate-700 text-justify">Jenkins terintegrasi dengan Jenkinsfile pada github dan docker untuk mempermudah proses deployment.</small>
                </CardHeader>
                <Image removeWrapper alt="Card background" className={`z-0 w-full h-full object-cover blur-sm ${isLoading ? "hidden" : "block"}`} src="/images/projects/jenkins.png" onLoad={() => setIsLoading(false)} />
              </Card>
            </Link>
            <Link href="https://portainer.prinafsika.world" target="_blank" className="col-span-12 sm:col-span-4 h-[400px]">
              <Card className="col-span-12 sm:col-span-4 h-[400px] hover:scale-105 border-2 border-sky-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <div className="pb-3">
                    <p className="text-md text-black/60 uppercase font-bold border border-sky-500 bg-sky-400 px-5 py-1 rounded-full">DevOps</p>
                  </div>
                  {isLoading ? (
                    <div className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-sky-400 animate-pulse">
                      <LoadingAnimation />
                    </div>
                  ) : (
                    <Image removeWrapper alt="Card background" className="z-0 h-36 w-full object-cover rounded-2xl border-2 border-sky-400 transition-opacity duration-500" src="/images/projects/docker.png" />
                  )}
                  <h4 className={`${isLoading ? "text-slate-700 " : "text-white"} font-medium text-large pt-2`}>Docker With Portainer</h4>
                  <small className={`${isLoading ? "text-slate-700 " : "text-white"}  text-justify`}>Selayaknya Docker Desktop, Portainer ini dapat digunakan untuk memantau server dan juga memantau container via web interface.</small>
                </CardHeader>
                <Image removeWrapper alt="Card background" className={`z-0 w-full h-full object-cover blur-sm ${isLoading ? "hidden" : "block"}`} src="/images/projects/docker.png" onLoad={() => setIsLoading(false)} />
              </Card>
            </Link>
            <Link href="https://getcrew.prinafsika.world" target="_blank" className="col-span-12 sm:col-span-8 h-[400px]">
              <Card isFooterBlurred className="col-span-12 sm:col-span-8 h-[400px] hover:scale-105 border-2 border-teal-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <div className="pb-3">
                    <p className="text-md text-black/60 uppercase font-bold border border-teal-500 bg-teal-400 px-5 py-1 rounded-full">Frontend</p>
                  </div>
                </CardHeader>
                {isLoading ? <LoadingAnimation /> : <Image removeWrapper alt="GetCrew background" className="z-0 w-full h-full object-cover" src="/images/projects/getcrew.png" />}

                <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
                  <div className="flex flex-grow gap-2 items-center">
                    <Image alt="GetCrew app icon" className="rounded-full w-10 h-10 bg-transparent" src="/images/projects/logo-getcrew.png" />
                    <div className="flex flex-col">
                      <p className="text-tiny text-white/60">GetCrew</p>
                      <p className="text-tiny text-white/60">Best app for searching crews and jobs.</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
            <Link href="https://submission.prinafsika.world" target="_blank" className="col-span-12 sm:col-span-8 h-[400px]">
              <Card isFooterBlurred className="col-span-12 sm:col-span-8 h-[400px] hover:scale-105 border-2 border-red-500">
                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                  <div className="pb-3">
                    <p className="text-md text-black/60 uppercase font-bold border border-red-500 bg-red-400 px-5 py-1 rounded-full">Full Stack</p>
                  </div>
                </CardHeader>
                {isLoading ? <LoadingAnimation /> : <Image removeWrapper alt="Blog app background" className="z-0 w-full h-full object-cover" src="/images/projects/blog.png" />}

                <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
                  <div className="flex flex-grow gap-2 items-center">
                    <Image alt="Laravel app icon" className="rounded-full w-10 h-10 bg-transparent" src="https://skillicons.dev/icons?i=laravel" />
                    <div className="flex flex-col">
                      <p className="text-tiny text-white/60">Blog using Laravel</p>
                      <p className="text-tiny text-white/60">This blog made for learning Laravel.</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Projects;
