import React from 'react'
import Image from 'next/image'

function Certificate() {
  return (
    <div className="h-screen flex flex-col justify-center items-center lg:ml-64">
      <div className="border-2 border-indigo-500 p-5 shadow-lg shadow-indigo-500">
        <h1 className="text-3xl font-bold text-center text-white">Sabar euy, belum jadi.</h1>
        <h1 className="text-3xl font-bold text-center text-purple-500 pt-5">Website under construction!</h1>
      </div>
      <Image
        src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXfPCwNS5mwE35DBaiCRmZnZEodqTOVI7N2OinXwOvsi26eH4P7g3nP1o6mVDHKJ7EmsGor2WOJpqfuUQhLgF2bPBoD4uG3_5sO8KkgF7HptU9Ue0jF2DS2NLBi1DlIEj6XYqqVW5w?key=12pBkjFdccDo4by3UVWlmBOF"
        alt="Under Construction"
        width={500}
        height={500}
      />
    </div>
  )
}

export default Certificate
