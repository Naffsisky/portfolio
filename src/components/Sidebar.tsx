import Link from "next/link";

const Sidebar = () => {
  const year = new Date().getFullYear();

  return (
    <div className="w-64 bg-zinc-900 text-white items-center justify-start flex flex-col border-indigo-500 border-2 fixed h-full">
      <div>
        <h2 className="text-2xl text-indigo-500 py-5 relative w-fit h-auto flex bg-gradient-to-r items-center from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-extrabold text-transparent text-center select-auto">
          <Link href="/">Nap Menu&apos;s</Link>
        </h2>
      </div>
      <hr className="border-t border-blue-500 w-full led-running-border" />
      <div className="flex-grow flex flex-col justify-center">
        <ul className="flex flex-col">
          <Link href="/" className="mb-2 btn btn-primary bg-transparent">
            <li>
              <span className="text-white">Home</span>
            </li>
          </Link>
          <Link href="/about" className="mb-2 btn btn-primary bg-transparent">
            <li>
              <span className="text-white">About</span>
            </li>
          </Link>
          <li className="mb-2 btn btn-primary bg-transparent">
            <Link href="/projects">
              <span className="text-white">Projects</span>
            </Link>
          </li>
        </ul>
      </div>
      <hr className="border-t border-purple-500 w-full led-running-border" />
      <Link href="#" className="py-3 hover:underline">
        Github
      </Link>
      <Link href="#" className="py-3 hover:underline">
        LinkedIn
      </Link>
      <Link href="#" className="py-3 hover:underline">
        Instagram
      </Link>
      <hr className="border-t border-purple-500 w-full led-running-border" />
      <p className="text-center py-3">Copyright &copy; {year}</p>
    </div>
  );
};

export default Sidebar;
