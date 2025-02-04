// Card.jsx
/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ title, children, onClick }) => {
  return (
    <div 
      className="bg-gray-900/20 
      rounded-xl shadow-md 
      mb-4 p-5 
      cursor-pointer 
      hover:bg-[#4a4a4a] 
      transition-all duration-300 
      transform hover:-translate-y-1 
      hover:shadow-lg 
      border border-transparent 
      hover:border-[#5ff2b6]/30"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-[#5ff2b6] mb-2">
        {title}
      </h3>
      <div 
        className="
        text-sm 
        text-[#5ff2b6]
        leading-relaxed"
      >
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};

export default Card;