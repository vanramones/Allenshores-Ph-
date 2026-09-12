import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Form, Alert } from 'react-bootstrap';
import { FaStar, FaMapMarkerAlt, FaBookmark, FaRegBookmark, FaBalanceScale, FaCalendarCheck, FaHome, FaBed, FaSun, FaCheckCircle, FaTimesCircle, FaImages, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { beachesAPI, reviewsAPI, propertiesAPI } from '../../services/api';
import { useBookmarks } from '../../context/BookmarkContext';
import { useCompare } from '../../context/CompareContext';
import StarRating from '../../components/common/StarRating';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const BeachDetail = () => {
  const { id } = useParams();
  const [beach, setBeach] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [cottages, setCottages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToCompare, isInCompare } = useCompare();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [beachRes, reviewsRes, cottageRes, roomRes] = await Promise.all([
        beachesAPI.getById(id),
        reviewsAPI.getByBeach(id),
        propertiesAPI.getByBeach('cottage', id).catch(() => ({ data: [] })),
        propertiesAPI.getByBeach('room', id).catch(() => ({ data: [] }))
      ]);
      setBeach(beachRes.data);
      setReviews(reviewsRes.data);
      setCottages(cottageRes.data);
      setRooms(roomRes.data);
    } catch (error) {
      console.error('Error fetching beach:', error);
      toast.error('Beach not found');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(beach.id);
      toast.success(result ? 'Beach bookmarked!' : 'Bookmark removed');
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleCompare = () => {
    const result = addToCompare(beach);
    if (result.success) {
      toast.success('Added to compare');
    } else {
      toast.warning(result.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.author.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create({
        beach_id: beach.id,
        ...reviewForm
      });
      toast.success('Review submitted!');
      setReviewForm({ author: '', rating: 5, comment: '' });
      fetchData(); // Refresh reviews
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';

  if (loading) return <Loading text="Loading beach details..." />;
  if (!beach) return <Container className="py-5 text-center"><h3>Beach not found</h3></Container>;

  return (
    <div className="fade-in py-5">
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-4">
          <Link 
            to="/beaches" 
            className="text-decoration-none d-inline-flex align-items-center gap-2"
            style={{ 
              color: 'var(--primary)', 
              fontWeight: 500,
              transition: 'all 0.3s'
            }}
          >
            ← Back to Beaches
          </Link>
        </nav>

        <Row className="g-4">
          {/* Main Content */}
          <Col lg={8}>
            {/* Beach Image Gallery */}
            <div className="beach-gallery mb-4">
              {/* Main Image */}
              <div className="position-relative overflow-hidden beach-gallery-main" style={{ borderRadius: '24px' }}>
                <img
                  src={
                    beach.images && beach.images.length > 0
                      ? (beach.images[selectedImage]?.image_path || beach.image || defaultImage)
                      : (beach.image || defaultImage)
                  }
                  alt={beach.name}
                  className="w-100"
                  style={{ 
                    height: '450px', 
                    objectFit: 'cover',
                    boxShadow: 'var(--shadow-lg)',
                    cursor: 'pointer'
                  }}
                  onError={(e) => { e.target.src = defaultImage; }}
                  onClick={() => setLightboxOpen(true)}
                />
                {/* Navigation arrows if multiple images */}
                {beach.images && beach.images.length > 1 && (
                  <>
                    <button
                      className="beach-gallery-nav beach-gallery-prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(prev => prev === 0 ? beach.images.length - 1 : prev - 1);
                      }}
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      className="beach-gallery-nav beach-gallery-next"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(prev => prev === beach.images.length - 1 ? 0 : prev + 1);
                      }}
                    >
                      <FaChevronRight />
                    </button>
                    <div className="beach-gallery-counter">
                      {selectedImage + 1} / {beach.images.length}
                    </div>
                  </>
                )}
                <div className="position-absolute top-0 end-0 p-4 d-flex gap-3">
                  <Button
                    variant={isBookmarked(beach.id) ? 'danger' : 'light'}
                    onClick={handleBookmark}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      background: isBookmarked(beach.id) ? '#ef4444' : 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    {isBookmarked(beach.id) ? <FaBookmark size={18} /> : <FaRegBookmark size={18} />}
                  </Button>
                  <Button
                    variant={isInCompare(beach.id) ? 'warning' : 'light'}
                    onClick={handleCompare}
                    disabled={isInCompare(beach.id)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      background: isInCompare(beach.id) ? '#f59e0b' : 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <FaBalanceScale size={18} />
                  </Button>
                </div>
              </div>

              {/* Thumbnail Strip - Multiple Images */}
              {beach.images && beach.images.length > 1 && (
                <div className="beach-gallery-thumbnails">
                  {beach.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`beach-gallery-thumb ${selectedImage === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img
                        src={img.image_path}
                        alt={`${beach.name} ${idx + 1}`}
                        onError={(e) => { e.target.src = defaultImage; }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Image count badge */}
              {beach.images && beach.images.length > 0 && (
                <div className="beach-gallery-badge">
                  <FaImages className="me-1" />
                  {beach.images.length} {beach.images.length === 1 ? 'image' : 'images'}
                </div>
              )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && beach.images && beach.images.length > 0 && (
              <div className="beach-lightbox" onClick={() => setLightboxOpen(false)}>
                <button className="beach-lightbox-close" onClick={() => setLightboxOpen(false)}>
                  <FaTimesCircle size={32} />
                </button>
                <img
                  src={beach.images[selectedImage]?.image_path || beach.image || defaultImage}
                  alt={beach.name}
                  onClick={(e) => e.stopPropagation()}
                />
                {beach.images.length > 1 && (
                  <>
                    <button
                      className="beach-lightbox-nav beach-lightbox-prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(prev => prev === 0 ? beach.images.length - 1 : prev - 1);
                      }}
                    >
                      <FaChevronLeft size={24} />
                    </button>
                    <button
                      className="beach-lightbox-nav beach-lightbox-next"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(prev => prev === beach.images.length - 1 ? 0 : prev + 1);
                      }}
                    >
                      <FaChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Beach Info */}
            <Card className="mb-4" style={{ borderRadius: '20px', border: 'none', boxShadow: 'var(--shadow-md)' }}>
              <Card.Body style={{ padding: '2rem' }}>
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="flex-grow-1">
                    <h1 className="fw-bold mb-3" style={{ fontSize: '2.25rem', color: 'var(--dark)' }}>
                      {beach.name}
                    </h1>
                    <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '1.05rem' }}>
                      <FaMapMarkerAlt style={{ color: 'var(--primary)' }} />
                      <span>{beach.location}, {beach.region || 'Allen'}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <StarRating rating={parseFloat(beach.rating) || 0} size="md" />
                      <span className="fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark)' }}>
                        {parseFloat(beach.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.95rem' }}>
                      {beach.reviews_count || 0} reviews
                    </small>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mb-4">
                  <Badge 
                    bg="primary" 
                    style={{ 
                      padding: '0.6rem 1rem', 
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                      fontWeight: 600
                    }}
                  >
                    {beach.type || 'Beach'}
                  </Badge>
                  <Badge 
                    className={`badge-price-${(beach.price_level || 'budget').toLowerCase()}`}
                    style={{ 
                      padding: '0.6rem 1rem', 
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                      fontWeight: 600
                    }}
                  >
                    {beach.price_level || 'Budget'}
                  </Badge>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <h5 className="fw-bold mb-3" style={{ color: 'var(--dark)' }}>About This Beach</h5>
                  <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.8 }}>
                    {beach.description || 'A beautiful beach destination in Allen, Northern Samar. Perfect for relaxation and water activities.'}
                  </p>
                </div>
              </Card.Body>
            </Card>

            {/* Availability & Weather Section */}
            <Card className="mb-4" style={{ borderRadius: '20px', border: 'none', boxShadow: 'var(--shadow-md)' }}>
              <Card.Body style={{ padding: '2rem' }}>
                <h5 className="fw-bold mb-4" style={{ color: 'var(--dark)' }}>
                  <FaCheckCircle className="me-2" style={{ color: 'var(--primary)' }} />
                  Availability & Conditions
                </h5>
                <Row className="g-3">
                  {/* Cottages */}
                  <Col xs={12} md={6}>
                    <div className={`beach-avail-card ${beach.cottage_available ? 'available' : 'unavailable'}`}>
                      <div className="beach-avail-icon">
                        <FaHome />
                      </div>
                      <div className="beach-avail-info">
                        <div className="beach-avail-title">
                          Cottages
                          {beach.cottage_available ? (
                            <Badge bg="success" className="ms-2">Available</Badge>
                          ) : (
                            <Badge bg="secondary" className="ms-2">N/A</Badge>
                          )}
                        </div>
                        {beach.cottage_available && (
                          <div className="beach-avail-details">
                            <span>{beach.cottage_count || 0} cottages</span>
                            <span className="beach-avail-price">₱{beach.cottage_price || '0'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>

                  {/* Rooms */}
                  <Col xs={12} md={6}>
                    <div className={`beach-avail-card ${beach.room_available ? 'available' : 'unavailable'}`}>
                      <div className="beach-avail-icon">
                        <FaBed />
                      </div>
                      <div className="beach-avail-info">
                        <div className="beach-avail-title">
                          Rooms
                          {beach.room_available ? (
                            <Badge bg="success" className="ms-2">Available</Badge>
                          ) : (
                            <Badge bg="secondary" className="ms-2">N/A</Badge>
                          )}
                        </div>
                        {beach.room_available && (
                          <div className="beach-avail-details">
                            <span>{beach.room_count || 0} rooms</span>
                            <span className="beach-avail-price">₱{beach.room_price || '0'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>

                  {/* Weather Info */}
                  <Col xs={12} md={6}>
                    <div className="beach-avail-card weather-card">
                      <div className="beach-avail-icon weather-icon">
                        <FaSun />
                      </div>
                      <div className="beach-avail-info">
                        <div className="beach-avail-title">Weather Conditions</div>
                        <div className="beach-avail-details">
                          <span className="beach-weather-value">
                            {beach.weather_info || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Cottages Section */}
            {cottages.length > 0 && (
              <Card className="mb-4" style={{ borderRadius: '20px', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                <Card.Body style={{ padding: '2rem' }}>
                  <h5 className="fw-bold mb-4" style={{ color: 'var(--dark)' }}>
                    <FaHome className="me-2" style={{ color: 'var(--primary)' }} />
                    Available Cottages ({cottages.length})
                  </h5>
                  <Row className="g-3">
                    {cottages.map(cottage => {
                      const primaryImg = cottage.images?.find(i => i.is_primary) || cottage.images?.[0];
                      return (
                        <Col xs={12} md={6} key={cottage.id}>
                          <div className="beach-avail-card available h-100" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            {primaryImg && (
                              <img
                                src={primaryImg.image_path}
                                alt={cottage.name}
                                className="w-100 rounded mb-3"
                                style={{ height: '160px', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div className="beach-avail-info" style={{ width: '100%' }}>
                              <div className="beach-avail-title">{cottage.name}</div>
                              <div className="beach-avail-details">
                                <span>Cap: {cottage.capacity} pax</span>
                                <span className="beach-avail-price">₱{cottage.price}</span>
                              </div>
                              {cottage.description && (
                                <p className="text-muted small mt-2 mb-0">{cottage.description}</p>
                              )}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Rooms Section */}
            {rooms.length > 0 && (
              <Card className="mb-4" style={{ borderRadius: '20px', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                <Card.Body style={{ padding: '2rem' }}>
                  <h5 className="fw-bold mb-4" style={{ color: 'var(--dark)' }}>
                    <FaBed className="me-2" style={{ color: 'var(--primary)' }} />
                    Available Rooms ({rooms.length})
                  </h5>
                  <Row className="g-3">
                    {rooms.map(room => {
                      const primaryImg = room.images?.find(i => i.is_primary) || room.images?.[0];
                      return (
                        <Col xs={12} md={6} key={room.id}>
                          <div className="beach-avail-card available h-100" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            {primaryImg && (
                              <img
                                src={primaryImg.image_path}
                                alt={room.name}
                                className="w-100 rounded mb-3"
                                style={{ height: '160px', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div className="beach-avail-info" style={{ width: '100%' }}>
                              <div className="beach-avail-title">{room.name}</div>
                              <div className="beach-avail-details">
                                <span>Cap: {room.capacity} pax</span>
                                <span className="beach-avail-price">₱{room.price}</span>
                              </div>
                              {room.description && (
                                <p className="text-muted small mt-2 mb-0">{room.description}</p>
                              )}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Reviews Section */}
            <Card style={{ borderRadius: '20px', border: 'none', boxShadow: 'var(--shadow-md)' }}>
              <Card.Header style={{ 
                background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
                borderBottom: '1px solid var(--border)',
                padding: '1.5rem 2rem',
                borderRadius: '20px 20px 0 0'
              }}>
                <h5 className="mb-0 fw-bold" style={{ fontSize: '1.5rem', color: 'var(--dark)' }}>
                  Reviews ({reviews.length})
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: '2rem' }}>
                {/* Review Form */}
                <Form 
                  onSubmit={handleReviewSubmit} 
                  className="mb-5 p-4"
                  style={{ 
                    background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <h6 className="fw-bold mb-4" style={{ fontSize: '1.15rem', color: 'var(--dark)' }}>
                    Write a Review
                  </h6>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Your Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your name"
                          value={reviewForm.author}
                          onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Rating</Form.Label>
                        <Form.Select
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                          <option value={4}>⭐⭐⭐⭐ (4)</option>
                          <option value={3}>⭐⭐⭐ (3)</option>
                          <option value={2}>⭐⭐ (2)</option>
                          <option value={1}>⭐ (1)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Your Review</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Share your experience..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </Col>
                  </Row>
                </Form>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-muted text-center py-3">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {reviews.map(review => (
                      <div key={review.id} className="border-bottom pb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong>{review.author}</strong>
                            <div><StarRating rating={review.rating} size="sm" /></div>
                          </div>
                          <small className="text-muted">
                            {new Date(review.created_at).toLocaleDateString()}
                          </small>
                        </div>
                        <p className="mb-0 text-muted">{review.comment || 'No comment'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            <Card 
              className="sticky-top" 
              style={{ 
                top: '100px',
                borderRadius: '20px',
                border: 'none',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <Card.Body style={{ padding: '2rem' }}>
                <h5 className="fw-bold mb-4" style={{ fontSize: '1.35rem', color: 'var(--dark)' }}>
                  Book This Beach
                </h5>
                <div 
                  className="d-flex justify-content-between align-items-center mb-4 p-3"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(0, 119, 182, 0.05), rgba(0, 180, 216, 0.05))',
                    borderRadius: '12px'
                  }}
                >
                  <span className="text-muted" style={{ fontSize: '0.95rem' }}>Price per visit</span>
                  <span className="fw-bold" style={{ fontSize: '2rem', color: 'var(--primary)' }}>
                    ₱{beach.price || '0'}
                  </span>
                </div>
                <Link 
                  to={`/booking?beach=${beach.id}`} 
                  className="btn btn-primary w-100 mb-4"
                  style={{ padding: '1rem', fontSize: '1.05rem' }}
                >
                  <FaCalendarCheck className="me-2" />
                  Book Now
                </Link>
                <hr style={{ margin: '1.5rem 0' }} />
                <h6 className="fw-bold mb-3" style={{ fontSize: '1.1rem', color: 'var(--dark)' }}>
                  Quick Info
                </h6>
                <ul className="list-unstyled mb-0">
                  <li className="d-flex justify-content-between py-3 border-bottom">
                    <span className="text-muted" style={{ fontSize: '0.95rem' }}>Type</span>
                    <span className="fw-semibold" style={{ color: 'var(--dark)' }}>
                      {beach.type || 'Beach'}
                    </span>
                  </li>
                  <li className="d-flex justify-content-between py-3 border-bottom">
                    <span className="text-muted" style={{ fontSize: '0.95rem' }}>Price Level</span>
                    <span className="fw-semibold" style={{ color: 'var(--dark)' }}>
                      {beach.price_level || 'Budget'}
                    </span>
                  </li>
                  <li className="d-flex justify-content-between py-3 border-bottom">
                    <span className="text-muted" style={{ fontSize: '0.95rem' }}>Region</span>
                    <span className="fw-semibold" style={{ color: 'var(--dark)' }}>
                      {beach.region || 'Allen'}
                    </span>
                  </li>
                  <li className="d-flex justify-content-between py-3">
                    <span className="text-muted" style={{ fontSize: '0.95rem' }}>Total Reviews</span>
                    <span className="fw-semibold" style={{ color: 'var(--dark)' }}>
                      {beach.reviews_count || 0}
                    </span>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BeachDetail;
