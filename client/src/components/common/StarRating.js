import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarRating = ({ rating, size = 'sm', showValue = false, interactive = false, onChange }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const sizeClass = {
    sm: '0.85rem',
    md: '1rem',
    lg: '1.25rem'
  };

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <FaStar 
          key={i} 
          style={{ fontSize: sizeClass[size], cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => handleClick(i)}
        />
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <FaStarHalfAlt 
          key={i} 
          style={{ fontSize: sizeClass[size], cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => handleClick(i)}
        />
      );
    } else {
      stars.push(
        <FaRegStar 
          key={i} 
          className="star-empty"
          style={{ fontSize: sizeClass[size], cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => handleClick(i)}
        />
      );
    }
  }

  return (
    <span className="star-rating d-inline-flex align-items-center gap-1">
      {stars}
      {showValue && (
        <span className="ms-1 text-muted" style={{ fontSize: sizeClass[size] }}>
          ({rating.toFixed(1)})
        </span>
      )}
    </span>
  );
};

export default StarRating;
