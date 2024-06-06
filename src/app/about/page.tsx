"use client";
import { Details } from "@/components/Details";
import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

const items = [
  { title: "Detail 1", content: "This is the content of detail 1." },
  { title: "Detail 2", content: "This is the content of detail 2." },
  // Tambahkan item lainnya sesuai kebutuhan
];

function About() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24 bg-zinc-900  ml-64">
      <p className="text-rose-600">About!</p>
      <div className="h-screen overflow-hidden">
        <div className="flex h-screen px-8 pt-24 md:px-0">
          <Details className="mx-auto max-w-2xl">
            {items.map((item, index) => (
              <Details.Item key={index} className="group border-b border-white/10">
                {({ isActive, toggle }: { isActive: boolean; toggle: () => void }) => (
                  <>
                    <div className="flex cursor-pointer items-center py-4 pr-4" onClick={toggle}>
                      <div className="text-base text-white/75 transition group-hover:text-white">{item.title}</div>
                      <div className="relative ml-auto">
                        <XMarkIcon className={clsx({ "rotate-180": isActive, "rotate-45": !isActive }, "h-6 w-6 text-white/50 transition-transform duration-500")} />
                      </div>
                    </div>
                    <Details.Content className="overflow-hidden transition-all duration-500 will-change-[height]">
                      <p className="space-y-3 pb-4 text-base leading-relaxed text-[--tw-prose-body]">{item.content}</p>
                    </Details.Content>
                  </>
                )}
              </Details.Item>
            ))}
          </Details>
        </div>
      </div>
    </div>
  );
}

export default About;
