import React from "react";
import PropTypes from "prop-types";

const SpotlightCard = ({ hsl, hslMin, hslMax, size, className, children }) => {
  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(${hsl ? `hsl(${hslMin}, 50%, 50%)` : "white"}, ${hsl ? `hsl(${hslMax}, 50%, 50%)` : "white"})`,
      }}
    >
      {children}
    </div>
  );
};

SpotlightCard.propTypes = {
  hsl: PropTypes.bool,
  hslMin: PropTypes.number,
  hslMax: PropTypes.number,
  size: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
};

SpotlightCard.defaultProps = {
  hsl: false,
  hslMin: 0,
  hslMax: 360,
  size: 400,
  className: "",
  children: null,
};

export default SpotlightCard;
