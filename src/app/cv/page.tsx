'use client'

import { Button } from '@nextui-org/react'
import React from 'react'

function Cv() {
  const buttonDownload = () => {
    fetch('https://is3.cloudhost.id/public-data/Prinafsika-resume.pdf')
      .then((response) => {
        response.blob().then((blob) => {
          const fileURL = window.URL.createObjectURL(blob)
          let alink = document.createElement('a')
          alink.href = fileURL
          alink.download = 'CV-Prinafsika.pdf'
          alink.click()
        })
      })
      .catch((err) => {
        alert(`Download Failed!\n${err}`)
        console.log(err)
      })
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-6 bg-zinc-900 lg:ml-64">
      <h2 className="text-3xl font-bold text-purple-500 pb-5">Curriculum Vitae</h2>
      <iframe src="https://is3.cloudhost.id/public-data/Prinafsika-resume.pdf" className="w-full h-[60vh] lg:h-[80vh] rounded-xl border border-purple-500" allowFullScreen title="Resume"></iframe>
      {/* <div className="pt-5">
        <Button onClick={buttonDownload} className="text-white p-3 bg-transparent border border-purple-500 rounded-xl">
          Download
        </Button>
      </div> */}
    </div>
  )
}

export default Cv
