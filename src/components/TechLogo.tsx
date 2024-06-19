import React from "react";

const logos = [
  "https://skillicons.dev/icons?i=react",
  "https://skillicons.dev/icons?i=laravel",
  "https://skillicons.dev/icons?i=nextjs",
  "https://skillicons.dev/icons?i=typescript",
  "https://skillicons.dev/icons?i=remix",
  "https://skillicons.dev/icons?i=nestjs",
  "https://skillicons.dev/icons?i=nuxt",
  "https://skillicons.dev/icons?i=docker",
  "https://skillicons.dev/icons?i=php",
  "https://skillicons.dev/icons?i=javascript",
  "https://skillicons.dev/icons?i=html",
  "https://skillicons.dev/icons?i=css",
];

const TechLogo = () => {
  return (
    <div className="marquee-container overflow-hidden whitespace-nowrap">
      <div className="marquee-content flex w-max animate-marquee">
        {[...logos, ...logos].map((logo, index) => (
          <div key={index} className="flex items-center px-5">
            <img src={logo} alt="Tech logo" className="h-10 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechLogo;
