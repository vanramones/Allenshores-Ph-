import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Badge, Modal } from 'react-bootstrap';
import { FaSearch, FaStar, FaMapMarkerAlt, FaEye, FaImage, FaCheckCircle, FaMoneyBillWave, FaTag, FaCalendarAlt, FaHome, FaBed, FaThermometerHalf, FaLock } from 'react-icons/fa';
import { beachesAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const AdminBeaches = () => {
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewBeach, setViewBeach] = useState(null);

  useEffect(() => {
    fetchBeaches();
  }, []);

  const fetchBeaches = async () => {
    try {
      const response = await beachesAPI.getAll({ search });
      setBeaches(response.data);
    } catch (error) {
      console.error('Error fetching beaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBeaches();
  };

  const handleView = async (beach) => {
    try {
      const response = await beachesAPI.getById(beach.id);
      setViewBeach(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching beach details:', error);
      toast.error('Failed to load beach details');
    }
  };

  const handleEditFromView = () => {
    toast.info('Beach editing is now managed by beach owners only.');
  };

  const getPriceBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'budget': return 'success';
      case 'moderate': return 'primary';
      case 'premium': return 'danger';
      default: return 'secondary';
    }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80';

  if (loading) return <Loading text="Loading beaches..." />;

  return (
    <div className="admin-beaches fade-in">
      <div className="admin-page-actions mb-4">
        <h2 className="admin-page-heading mb-0">Beaches</h2>
        <Badge bg="secondary" className="d-flex align-items-center gap-1 p-2">
          <FaLock className="me-1" /> Read-Only (Owners manage their own beaches)
        </Badge>
      </div>

      {/* Search */}
      <Card className="admin-search-card mb-4 border-0">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search beaches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" variant="primary">
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>

      {/* Beaches Grid */}
      {beaches.length === 0 ? (
        <div className="admin-empty-state-box">
          <FaImage className="admin-empty-icon" />
          <h4>No beaches found</h4>
        </div>
      ) : (
        <Row className="g-4">
          {beaches.map(beach => (
            <Col md={6} lg={4} key={beach.id}>
              <Card className="admin-beach-card h-100 border-0">
                <div className="admin-beach-img-wrap position-relative">
                  <Card.Img
                    variant="top"
                    src={beach.image || defaultImage}
                    alt={beach.name}
                    onError={(e) => { e.target.src = defaultImage; }}
                  />
                  <Badge 
                    bg="dark" 
                    className="position-absolute top-0 start-0 m-2 admin-beach-id"
                  >
                    ID: {beach.id}
                  </Badge>
                  <Badge 
                    bg="warning" 
                    className="position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1 admin-beach-rating"
                  >
                    <FaStar /> {parseFloat(beach.rating || 0).toFixed(1)}
                  </Badge>
                  {beach.image_count > 0 && (
                    <Badge 
                      bg="primary" 
                      className="position-absolute bottom-0 end-0 m-2"
                    >
                      <FaImage className="me-1" /> {beach.image_count}
                    </Badge>
                  )}
                </div>
                <Card.Body>
                  <h5 className="admin-beach-name mb-1">{beach.name}</h5>
                  <p className="admin-beach-location small mb-2">
                    <FaMapMarkerAlt className="me-1" />
                    {beach.location}
                  </p>
                  <div className="d-flex gap-2 mb-3">
                    <Badge bg={getPriceBadgeClass(beach.price_level)}>
                      {beach.price_level || 'Budget'}
                    </Badge>
                    <Badge bg="secondary">{beach.type || 'Beach'}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="admin-beach-price">₱{beach.price || 0}</span>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleView(beach)}
                        title="View Details"
                      >
                        <FaEye />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" className="admin-beach-modal">
        <Modal.Header closeButton>
          <Modal.Title>Beach Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewBeach && (
            <div className="admin-beach-view">
              {/* Image Gallery */}
              {viewBeach.images && viewBeach.images.length > 0 ? (
                <div className="admin-view-gallery mb-4">
                  <Row className="g-2">
                    {viewBeach.images.map((img, idx) => (
                      <Col xs={12} sm={6} md={4} key={img.id}>
                        <div className={`admin-view-image-wrap ${img.is_primary ? 'is-primary' : ''}`}>
                          <img
                            src={img.image_path}
                            alt={`${viewBeach.name} ${idx + 1}`}
                            className="admin-view-image"
                            onError={(e) => { e.target.src = defaultImage; }}
                          />
                          {img.is_primary && (
                            <Badge bg="success" className="admin-view-primary-badge">
                              <FaCheckCircle className="me-1" /> Primary
                            </Badge>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              ) : (
                <div className="admin-view-no-image mb-4">
                  <FaImage className="admin-view-no-image-icon" />
                  <p>No images uploaded</p>
                </div>
              )}

              {/* Beach Info */}
              <Row className="g-3 mb-3">
                <Col xs={12}>
                  <h4 className="admin-view-beach-name">{viewBeach.name}</h4>
                  <p className="admin-view-location">
                    <FaMapMarkerAlt className="me-1" />
                    {viewBeach.location}, {viewBeach.region}
                  </p>
                </Col>
                <Col xs={6} md={3}>
                  <div className="admin-view-info-card">
                    <small className="text-muted">Price</small>
                    <div className="admin-view-info-value">
                      <FaMoneyBillWave className="me-1" />
                      ₱{viewBeach.price || 0}
                    </div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="admin-view-info-card">
                    <small className="text-muted">Price Level</small>
                    <div className="admin-view-info-value">
                      <FaTag className="me-1" />
                      {viewBeach.price_level || 'Budget'}
                    </div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="admin-view-info-card">
                    <small className="text-muted">Type</small>
                    <div className="admin-view-info-value">
                      <FaImage className="me-1" />
                      {viewBeach.type || 'Beach'}
                    </div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="admin-view-info-card">
                    <small className="text-muted">Rating</small>
                    <div className="admin-view-info-value">
                      <FaStar className="me-1" />
                      {parseFloat(viewBeach.rating || 0).toFixed(1)} ({viewBeach.reviews_count || 0} reviews)
                    </div>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="admin-view-description">
                    <strong>Description</strong>
                    <p>{viewBeach.description || 'No description available.'}</p>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="admin-view-meta">
                    <small className="text-muted">
                      <FaCalendarAlt className="me-1" />
                      Created: {new Date(viewBeach.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </small>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminBeaches;
