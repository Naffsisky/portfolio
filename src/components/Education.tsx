import Image from 'next/image'
import React from 'react'

function Education() {
  return (
    <div className="pt-3">
      <section className="pb-5 flex flex-col justify-center items-center">
        <div>
          <Image src="https://is3.cloudhost.id/public-data/logo/logo-upn.png" alt="logo" width={300} height={300} />
        </div>
        <div className="pt-3">
          <h1 className="text-xl font-bold text-center text-white">Universitas Pembangunan Nasional &quot;Veteran&quot; Jawa Timur</h1>
          <p className="text-xl font-bold text-center text-white pt-2">S1 Teknik Informatika</p>
          <p className="text-xl font-bold text-center text-white pt-2">IPK: 3.94 / 4.00</p>
          <p className="text-xl font-bold text-center text-white pt-2">2021 - 2025</p>
        </div>
      </section>
      {/* <section className="pt-5 flex flex-col justify-center items-center">
        <div>
          <Image src="https://is3.cloudhost.id/public-data/logo-smansa.png" alt="logo" width={300} height={300} />
        </div>
        <div className="pt-3">
          <h1 className="text-xl font-bold text-center text-white">SMAN 1 Rangkasbitung</h1>
          <p className="text-xl font-bold text-center text-white pt-2">Matematika & IPA</p>
          <p className="text-xl font-bold text-center text-white pt-2">Nilai: 86.93 / 100</p>
          <p className="text-xl font-bold text-center text-white pt-2">2018 - 2021</p>
        </div>
      </section> */}
    </div>
  )
}

export default Education
