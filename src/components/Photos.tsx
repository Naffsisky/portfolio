import React from "react";
import Image from "next/image";

function Photos() {
  return (
    <div className="carousel carousel-center w-10/12 p-4 space-x-5 bg-zinc-800 rounded-box">
      <div className="carousel-item">
        <Image src="/images/profile/1.png" className="rounded-box" alt="img1" width={300} height={300} />
      </div>
      <div className="carousel-item">
        <Image src="/images/profile/2.png" className="rounded-box" alt="img2" width={300} height={300} />
      </div>
      <div className="carousel-item">
        <Image src="/images/profile/3.png" className="rounded-box" alt="img3" width={300} height={300} />
      </div>
      <div className="carousel-item">
        <Image src="/images/profile/6.png" className="rounded-box" alt="img4" width={300} height={300} />
      </div>
      <div className="carousel-item">
        <Image src="/images/profile/5.png" className="rounded-box" alt="img5" width={300} height={300} />
      </div>
      <div className="carousel-item">
        <Image src="/images/profile/4.png" className="rounded-box" alt="img6" width={300} height={300} />
      </div>
    </div>
  );
}

export default Photos;
