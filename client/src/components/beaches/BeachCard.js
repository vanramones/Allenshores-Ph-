import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaStar, FaMapMarkerAlt, FaBookmark, FaRegBookmark, FaEye, FaCheck, FaTag, FaUsers } from 'react-icons/fa';
import { useBookmarks } from '../../context/BookmarkContext';
import { useCompare } from '../../context/CompareContext';
import { toast } from 'react-toastify';

const BeachCard = ({ beach }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await toggleBookmark(beach.id);
      toast.success(result ? 'Beach bookmarked!' : 'Bookmark removed');
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare(beach.id)) {
      removeFromCompare(beach.id);
      toast.info('Removed from compare');
    } else {
      const result = addToCompare(beach);
      if (result.success) {
        toast.success('Added to compare');
      } else {
        toast.warning(result.message);
      }
    }
  };

  const getPriceBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'budget': return 'price-badge-budget';
      case 'moderate': return 'price-badge-moderate';
      case 'premium': return 'price-badge-premium';
      default: return 'price-badge-budget';
    }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80';

  return (
    <Card className="beach-card-new h-100">
      <div className="beach-card-image-wrapper">
        <Card.Img 
          variant="top" 
          src={beach.image || defaultImage}
          alt={beach.name}
          className="beach-card-image"
          onError={(e) => { e.target.src = defaultImage; }}
        />
        
        {/* Bookmark Button */}
        <button 
          className={`bookmark-btn ${isBookmarked(beach.id) ? 'active' : ''}`}
          onClick={handleBookmark}
          title={isBookmarked(beach.id) ? 'Remove bookmark' : 'Bookmark'}
        >
          {isBookmarked(beach.id) ? <FaBookmark /> : <FaRegBookmark />}
        </button>

        {/* Compare Badge */}
        <div className="compare-badge" onClick={handleCompare}>
          Compare
        </div>

        {/* Rating Badge */}
        <div className="rating-badge">
          <FaStar className="me-1" />
          {parseFloat(beach.rating || 0).toFixed(1)}
        </div>
      </div>
      
      <Card.Body className="beach-card-body">
        <h5 className="beach-card-title">{beach.name}</h5>
        
        <div className="beach-card-location">
          <FaMapMarkerAlt className="location-icon" />
          <span>Allen, Northern Samar, Philippines</span>
        </div>

        <div className="beach-card-meta">
          <span className={`price-badge ${getPriceBadgeClass(beach.price_level)}`}>
            <FaTag className="me-1" />
            {beach.price_level || 'Budget'}
          </span>
          <span className="type-badge">
            {beach.type || 'Resort Beach'}
          </span>
          <span className="visitors-badge">
            <FaUsers className="me-1" />
            {beach.reviews_count || 0}
          </span>
        </div>

        <div className="beach-card-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar 
                key={star} 
                className={star <= Math.round(beach.rating || 0) ? 'star-filled' : 'star-empty'} 
              />
            ))}
          </div>
          <span className="review-count">({beach.reviews_count || 0})</span>
        </div>

        <div className="beach-card-actions">
          <Link to={`/beaches/${beach.id}`} className="btn-view-details">
            <FaEye className="me-2" />
            View Details
          </Link>
          <button 
            className={`btn-add-compare ${isInCompare(beach.id) ? 'added' : ''}`}
            onClick={handleCompare}
          >
            <FaCheck className="me-1" />
            {isInCompare(beach.id) ? 'Added' : 'Add'}
          </button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default BeachCard;
