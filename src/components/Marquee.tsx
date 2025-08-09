import Image from 'next/image'

const items = [
  {
    name: "UPN 'Veteran' Jawa Timur",
    title: 'Teknik Informatika',
    image: '/images/company/upn.png',
  },
  {
    name: 'Bangkit Academy',
    title: 'Cloud Computing',
    image: '/images/company/bangkit.png',
  },
  {
    name: 'Indi Technology',
    title: 'Full Stack Developer',
    image: '/images/company/indi-technology.png',
  },
  {
    name: 'Flyhigh Sinergi Indonesia',
    title: 'Full Stack Developer',
    image: '/images/company/flyhigh.jpeg',
  },
  {
    name: 'Google',
    title: 'Cloud Computing (ACE)',
    image: '/images/company/google.png',
  },
  {
    name: 'Cisco',
    title: 'Network Engineer',
    image: '/images/company/cisco.png',
  },
  {
    name: 'Dicoding',
    title: 'Backend Developer',
    image: '/images/company/dicoding.png',
  },
  {
    name: 'Cyber Academy',
    title: 'Cyber Security (Blue Team)',
    image: '/images/company/cyber-academy.png',
  },
  {
    name: 'The British Institute',
    title: 'English',
    image: '/images/company/tbi.png',
  },
]

export default function Marquee() {
  return (
    <div className="items-center">
      <div className="relative flex lg:max-w-screen-lg max-w-[22rem] overflow-hidden py-5">
        <div className="flex w-max animate-marquee [--duration:30s]">
          {[...items, ...items].map((item, index) => (
            <div key={index} className="h-full px-2.5">
              <div className="relative h-full w-[24rem] rounded-2xl border border-white/5 bg-white/5 px-8 py-6">
                <div className="mt-auto flex items-center justify-center gap-4">
                  <div className="flex items-center gap-8">
                    {/* eslint-disable-next-line */}
                    <Image src={item.image} alt={item.name} className="h-14 w-14" />
                    <div className="flex flex-col text-sm">
                      <div className="text-white">{item.name}</div>
                      <div className="text-white/75">{item.title}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
