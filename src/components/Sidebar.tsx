import Link from "next/link";

const Sidebar = () => {
  return (
    <div className="w-64 bg-zinc-900 text-white items-center justify-start flex flex-col border-indigo-500 border-2 fixed h-full z-10">
      <h2 className="text-2xl text-indigo-500 py-5 relative top-0 w-fit h-auto justify-center flex bg-gradient-to-r items-center from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-extrabold text-transparent text-center select-auto">
        <Link href="/">Nap Menu&apos;s</Link>
      </h2>
      <hr className="border-t border-indigo-500 w-full led-running-border" />
      <div className="py-5">
        <ul className="flex flex-col">
          <li className="mb-2 btn btn-primary bg-transparent">
            <Link href="/">
              <span className="text-white">Home</span>
            </Link>
          </li>
          <li className="mb-2 btn btn-primary bg-transparent">
            <Link href="/about">
              <span className="text-white">About</span>
            </Link>
          </li>
        </ul>
      </div>
      <hr className="border-t border-indigo-500 w-full led-running-border" />
      <Link href="#" className="py-3 hover:underline">Github</Link>
      <Link href="#" className="py-3 hover:underline">LinkedIn</Link>
      <Link href="#" className="py-3 hover:underline">Instagram</Link>
    </div>
  );
};

export default Sidebar;
