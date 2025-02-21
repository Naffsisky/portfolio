'use client'
import Link from 'next/link'
import { useState } from 'react'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa6'
import { RiInstagramFill } from 'react-icons/ri'

const Sidebar = () => {
  const year = new Date().getFullYear()
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div>
      <button className="lg:hidden p-2 fixed top-0 left-0 z-30 pt-7" onClick={toggleSidebar}>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />}
        </svg>
      </button>
      <div
        className={`fixed h-full z-20 bg-zinc-900 text-white items-center justify-start flex flex-col border-indigo-500 rounded-2xl border-2 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out w-64`}
      >
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
            <Link href="/projects" className="mb-2 btn btn-primary bg-transparent">
              <li>
                <span className="text-white">Projects</span>
              </li>
            </Link>
            <Link href="/certificates" className="mb-2 btn btn-primary bg-transparent">
              <li>
                <span className="text-white">Certificates</span>
              </li>
            </Link>
            <Link href="/blog" className="mb-2 btn btn-primary bg-transparent">
              <li>
                <span className="text-white">Blog</span>
              </li>
            </Link>
          </ul>
        </div>
        <hr className="border-t border-purple-500 w-full led-running-border" />
        <Link href="https://github.com/Naffsisky" target="_blank" className="py-3 hover:underline hover:text-purple-500">
          <div className="grid grid-cols-5 items-center">
            <p></p>
            <span className="col-span-1 flex justify-center">
              <FaGithub />
            </span>
            <span className="col-span-1">Github</span>
          </div>
        </Link>
        <Link href="https://linkedin.com/in/prinafsika/" target="_blank" className="py-3 hover:underline hover:text-purple-500">
          <div className="grid grid-cols-5 items-center">
            <p></p>
            <span className="col-span-1 flex justify-center">
              <FaLinkedinIn />
            </span>
            <span className="col-span-1">LinkedIn</span>
          </div>
        </Link>
        <Link href="https://www.instagram.com/naffsvn/" target="_blank" className="py-3 hover:underline hover:text-purple-500">
          <div className="grid grid-cols-5 items-center">
            <p></p>
            <span className="col-span-1 flex justify-center">
              <RiInstagramFill />
            </span>
            <span className="col-span-1">Instagram</span>
          </div>
        </Link>
        <hr className="border-t border-purple-500 w-full led-running-border" />
        <p className="text-center py-3">Copyright &copy; {year}</p>
      </div>
    </div>
  )
}

export default Sidebar
