import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Image, Button } from "@nextui-org/react";
import Link from "next/link";

function Projects() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      <h2 className="text-3xl font-bold text-purple-500 pb-5">Projects</h2>
      <div className="py-5">
        <section>
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
            <button
              type="button"
              className="text-gray-900 border border-white hover:border-gray-200 dark:border-gray-900 dark:bg-gray-900 dark:hover:border-gray-700 bg-white focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3 dark:text-white dark:focus:ring-gray-800"
            >
              UI/UX
            </button>
          </div>
        </section>
        <section className="mt-10">
          <div className="max-w-[900px] gap-4 grid grid-cols-12 grid-rows-2 px-8">
            <Link href="https://www.figma.com/design/IpnKOro0C1yxjI5y1oHJgQ/KuliKu?node-id=0-1&t=KZZajgk0Ab7vqdSa-1" target="_blank" className="col-span-12 sm:col-span-4 h-[300px]">
              <Card className="col-span-12 sm:col-span-4 h-[300px] hover:scale-105 border-2 border-blue-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <p className="text-tiny text-black/60 uppercase font-bold">UI/UX</p>
                  <h4 className="text-indigo-500 font-medium text-large">KuliKu Design</h4>
                  <small className="text-slate-700 text-justify">Design ini dibuat untuk memenuhi tugas matakuliah UI/UX.</small>
                  <small className="text-slate-700 text-justify">KuliKu adalah sebuah aplikasi pihak ke 3 atau yang bertugas sebagai midman/penengah antara pekerja dan client.</small>
                </CardHeader>
                <Image removeWrapper alt="Card background" className="z-0 w-full h-full object-cover blur-sm" src="/images/projects/kuliku.png" />
              </Card>
            </Link>
            <Link href="https://www.figma.com/design/GGBxPByiMaBTEdSya9zw5y/MITA-Apps?node-id=0-1&t=uMDN3JPO9X0HOBHj-1" target="_blank" className="col-span-12 sm:col-span-4 h-[300px]">
              <Card className="col-span-12 sm:col-span-4 h-[300px] hover:scale-105 border-2 border-blue-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <p className="text-tiny text-black/60 uppercase font-bold">UI/UX</p>
                  <h4 className="text-indigo-500 font-medium text-large">MITA Mobile App</h4>
                  <small className="text-slate-700 text-justify">Design ini dibuat sebagai wireframe dari aplikasi MITA Mobile.</small>
                </CardHeader>
                <Image removeWrapper alt="Card background" className="z-0 w-full h-full object-cover blur-sm" src="/images/projects/mita-ui.png" />
              </Card>
            </Link>
            <Link href="/images/projects/jenkins.png" target="_blank" className="col-span-12 sm:col-span-4 h-[300px]">
              <Card className="col-span-12 sm:col-span-4 h-[300px] hover:scale-105 border-2 border-blue-500">
                <CardHeader className="absolute z-10 top-1 flex-col !items-start">
                  <p className="text-tiny text-black/60 uppercase font-bold">Automation</p>
                  <h4 className="text-indigo-500 font-medium text-large">Jenkins Automation</h4>
                  <small className="text-slate-700 text-justify">Jenkins terintegrasi dengan Jenkinsfile pada github dan docker untuk mempermudah proses deployment.</small>
                </CardHeader>
                <Image removeWrapper alt="Card background" className="z-0 w-full h-full object-cover blur-sm" src="/images/projects/jenkins.png" />
              </Card>
            </Link>
            <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-5">
              <CardHeader className="absolute z-10 top-1 flex-col items-start">
                <p className="text-tiny text-white/60 uppercase font-bold">New</p>
                <h4 className="text-black font-medium text-2xl">Acme camera</h4>
              </CardHeader>
              <Image removeWrapper alt="Card example background" className="z-0 w-full h-full scale-125 -translate-y-6 object-cover" src="https://nextui.org/images/card-example-6.jpeg" />
              <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                <div>
                  <p className="text-black text-tiny">Available soon.</p>
                  <p className="text-black text-tiny">Get notified.</p>
                </div>
                <Button className="text-tiny" color="primary" radius="full" size="sm">
                  Notify Me
                </Button>
              </CardFooter>
            </Card>
            <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-7">
              <CardHeader className="absolute z-10 top-1 flex-col items-start">
                <p className="text-tiny text-white/60 uppercase font-bold">Your day your way</p>
                <h4 className="text-white/90 font-medium text-xl">Your checklist for better sleep</h4>
              </CardHeader>
              <Image removeWrapper alt="Relaxing app background" className="z-0 w-full h-full object-cover" src="https://nextui.org/images/card-example-5.jpeg" />
              <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
                <div className="flex flex-grow gap-2 items-center">
                  <Image alt="Breathing app icon" className="rounded-full w-10 h-11 bg-black" src="https://nextui.org/images/breathing-app-icon.jpeg" />
                  <div className="flex flex-col">
                    <p className="text-tiny text-white/60">Breathing App</p>
                    <p className="text-tiny text-white/60">Get a good nights sleep.</p>
                  </div>
                </div>
                <Button radius="full" size="sm">
                  Get App
                </Button>
              </CardFooter>
            </Card>
            <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-7">
              <CardHeader className="absolute z-10 top-1 flex-col items-start">
                <p className="text-tiny text-white/60 uppercase font-bold">Your day your way</p>
                <h4 className="text-white/90 font-medium text-xl">Your checklist for better sleep</h4>
              </CardHeader>
              <Image removeWrapper alt="Relaxing app background" className="z-0 w-full h-full object-cover" src="https://nextui.org/images/card-example-5.jpeg" />
              <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
                <div className="flex flex-grow gap-2 items-center">
                  <Image alt="Breathing app icon" className="rounded-full w-10 h-11 bg-black" src="https://nextui.org/images/breathing-app-icon.jpeg" />
                  <div className="flex flex-col">
                    <p className="text-tiny text-white/60">Breathing App</p>
                    <p className="text-tiny text-white/60">Get a good nights sleep.</p>
                  </div>
                </div>
                <Button radius="full" size="sm">
                  Get App
                </Button>
              </CardFooter>
            </Card>
            <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-5">
              <CardHeader className="absolute z-10 top-1 flex-col items-start">
                <p className="text-tiny text-white/60 uppercase font-bold">New</p>
                <h4 className="text-black font-medium text-2xl">Acme camera</h4>
              </CardHeader>
              <Image removeWrapper alt="Card example background" className="z-0 w-full h-full scale-125 -translate-y-6 object-cover" src="https://nextui.org/images/card-example-6.jpeg" />
              <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                <div>
                  <p className="text-black text-tiny">Available soon.</p>
                  <p className="text-black text-tiny">Get notified.</p>
                </div>
                <Button className="text-tiny" color="primary" radius="full" size="sm">
                  Notify Me
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Projects;
