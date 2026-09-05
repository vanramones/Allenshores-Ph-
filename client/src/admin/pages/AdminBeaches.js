import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Badge, Modal } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaStar, FaMapMarkerAlt, FaEye, FaImage, FaCheckCircle, FaTimes, FaMoneyBillWave, FaTag, FaCalendarAlt, FaHome, FaBed, FaThermometerHalf } from 'react-icons/fa';
import { beachesAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const AdminBeaches = () => {
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewBeach, setViewBeach] = useState(null);
  const [editingBeach, setEditingBeach] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    region: 'Allen',
    rating: 0,
    reviews_count: 0,
    price: '',
    price_level: 'Budget',
    type: 'Beach',
    description: '',
    cottage_available: false,
    cottage_count: 0,
    cottage_price: '0',
    room_available: false,
    room_count: 0,
    room_price: '0',
    water_temp: '',
    weather_info: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [primaryImageId, setPrimaryImageId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const openModal = async (beach = null) => {
    if (beach) {
      try {
        const response = await beachesAPI.getById(beach.id);
        const fullBeach = response.data;

        setEditingBeach(beach);
        setFormData({
          name: fullBeach.name || '',
          location: fullBeach.location || '',
          region: fullBeach.region || 'Allen',
          rating: fullBeach.rating || 0,
          reviews_count: fullBeach.reviews_count || 0,
          price: fullBeach.price || '',
          price_level: fullBeach.price_level || 'Budget',
          type: fullBeach.type || 'Beach',
          description: fullBeach.description || '',
          cottage_available: !!fullBeach.cottage_available,
          cottage_count: fullBeach.cottage_count || 0,
          cottage_price: fullBeach.cottage_price || '0',
          room_available: !!fullBeach.room_available,
          room_count: fullBeach.room_count || 0,
          room_price: fullBeach.room_price || '0',
          water_temp: fullBeach.water_temp || '',
          weather_info: fullBeach.weather_info || ''
        });
        setExistingImages(fullBeach.images || []);
        setDeletedImages([]);
        setPrimaryImageId(fullBeach.images?.find(img => img.is_primary)?.id || null);
      } catch (error) {
        console.error('Error fetching beach details:', error);
        toast.error('Failed to load beach details');
      }
    } else {
      setEditingBeach(null);
      setFormData({
        name: '',
        location: '',
        region: 'Allen',
        rating: 0,
        reviews_count: 0,
        price: '',
        price_level: 'Budget',
        type: 'Beach',
        description: '',
        cottage_available: false,
        cottage_count: 0,
        cottage_price: '0',
        room_available: false,
        room_count: 0,
        room_price: '0',
        water_temp: '',
        weather_info: ''
      });
      setExistingImages([]);
      setDeletedImages([]);
      setPrimaryImageId(null);
    }
    setImageFiles([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Append to existing files instead of replacing
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveNewImage = (index) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleRemoveExistingImage = (imageId) => {
    setDeletedImages([...deletedImages, imageId]);
    setExistingImages(existingImages.filter(img => img.id !== imageId));
    if (primaryImageId === imageId) {
      const remaining = existingImages.filter(img => img.id !== imageId);
      setPrimaryImageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSetPrimary = (imageId) => {
    setPrimaryImageId(imageId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      imageFiles.forEach(file => {
        data.append('images', file);
      });

      if (deletedImages.length > 0) {
        data.append('deletedImages', JSON.stringify(deletedImages));
      }

      if (primaryImageId) {
        data.append('primaryImageId', primaryImageId);
      }

      if (editingBeach) {
        await beachesAPI.update(editingBeach.id, data);
        toast.success('Beach updated successfully');
      } else {
        await beachesAPI.create(data);
        toast.success('Beach created successfully');
      }
      setShowModal(false);
      fetchBeaches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save beach');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this beach?')) return;

    try {
      await beachesAPI.delete(id);
      toast.success('Beach deleted successfully');
      fetchBeaches();
    } catch (error) {
      toast.error('Failed to delete beach');
    }
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
    setShowViewModal(false);
    if (viewBeach) {
      openModal(viewBeach);
    }
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
        <h2 className="admin-page-heading mb-0">Manage Beaches</h2>
        <Button variant="primary" onClick={() => openModal()} className="admin-add-btn">
          <FaPlus className="me-2" />
          Add Beach
        </Button>
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
          <Button variant="primary" onClick={() => openModal()}>Add First Beach</Button>
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
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => openModal(beach)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(beach.id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" className="admin-beach-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editingBeach ? 'Edit Beach' : 'Add New Beach'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Beach Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g., 150"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price Level</Form.Label>
                  <Form.Select
                    name="price_level"
                    value={formData.price_level}
                    onChange={handleChange}
                  >
                    <option value="Budget">Budget</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Premium">Premium</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Beach Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="Beach">Beach</option>
                    <option value="White Sand">White Sand</option>
                    <option value="Rocky">Rocky</option>
                    <option value="Cove">Cove</option>
                    <option value="Resort">Resort</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              {/* Cottage Availability */}
              <Col xs={12}>
                <div className="admin-form-section-title">
                  <FaHome className="me-2" /> Cottage Availability
                </div>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    label="Cottages Available"
                    name="cottage_available"
                    checked={formData.cottage_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, cottage_available: e.target.checked }))}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottage Count</Form.Label>
                  <Form.Control
                    type="number"
                    name="cottage_count"
                    value={formData.cottage_count}
                    onChange={handleChange}
                    min="0"
                    disabled={!formData.cottage_available}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottage Price (₱)</Form.Label>
                  <Form.Control
                    type="text"
                    name="cottage_price"
                    value={formData.cottage_price}
                    onChange={handleChange}
                    placeholder="e.g., 300"
                    disabled={!formData.cottage_available}
                  />
                </Form.Group>
              </Col>

              {/* Room Availability */}
              <Col xs={12}>
                <div className="admin-form-section-title mt-2">
                  <FaBed className="me-2" /> Room Availability
                </div>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    label="Rooms Available"
                    name="room_available"
                    checked={formData.room_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, room_available: e.target.checked }))}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Room Count</Form.Label>
                  <Form.Control
                    type="number"
                    name="room_count"
                    value={formData.room_count}
                    onChange={handleChange}
                    min="0"
                    disabled={!formData.room_available}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Room Price (₱)</Form.Label>
                  <Form.Control
                    type="text"
                    name="room_price"
                    value={formData.room_price}
                    onChange={handleChange}
                    placeholder="e.g., 500"
                    disabled={!formData.room_available}
                  />
                </Form.Group>
              </Col>

              {/* Weather & Temperature */}
              <Col xs={12}>
                <div className="admin-form-section-title mt-2">
                  <FaThermometerHalf className="me-2" /> Weather & Water Temperature
                </div>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Water Temperature</Form.Label>
                  <Form.Control
                    type="text"
                    name="water_temp"
                    value={formData.water_temp}
                    onChange={handleChange}
                    placeholder="e.g., 28°C"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Weather Info</Form.Label>
                  <Form.Control
                    type="text"
                    name="weather_info"
                    value={formData.weather_info}
                    onChange={handleChange}
                    placeholder="e.g., Sunny, Calm waters"
                  />
                </Form.Group>
              </Col>

              {/* Image Upload */}
              <Col xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaImage className="me-2" />
                    Beach Images
                  </Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="admin-image-input"
                  />
                  <Form.Text className="text-muted">
                    You can upload multiple images. First image will be the primary image.
                  </Form.Text>
                </Form.Group>

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="admin-image-preview-list mb-3">
                    <p className="admin-image-section-title">New Images</p>
                    <Row className="g-2">
                      {imagePreviews.map((preview, index) => (
                        <Col xs={6} md={4} lg={3} key={index}>
                          <div className="admin-image-preview-wrap">
                            <img src={preview} alt={`New ${index + 1}`} className="admin-image-preview" />
                            <button
                              type="button"
                              className="admin-image-remove"
                              onClick={() => handleRemoveNewImage(index)}
                            >
                              <FaTimes />
                            </button>
                            {index === 0 && (
                              <span className="admin-image-primary-badge">
                                <FaCheckCircle className="me-1" /> Primary
                              </span>
                            )}
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="admin-image-preview-list">
                    <p className="admin-image-section-title">Existing Images</p>
                    <Row className="g-2">
                      {existingImages.map((img) => (
                        <Col xs={6} md={4} lg={3} key={img.id}>
                          <div className={`admin-image-preview-wrap ${primaryImageId === img.id ? 'is-primary' : ''}`}>
                            <img src={img.image_path} alt={`Beach ${img.id}`} className="admin-image-preview" />
                            <button
                              type="button"
                              className="admin-image-remove"
                              onClick={() => handleRemoveExistingImage(img.id)}
                            >
                              <FaTimes />
                            </button>
                            <button
                              type="button"
                              className="admin-image-primary-btn"
                              onClick={() => handleSetPrimary(img.id)}
                              title="Set as primary"
                            >
                              {primaryImageId === img.id ? (
                                <><FaCheckCircle className="me-1" /> Primary</>
                              ) : (
                                'Set Primary'
                              )}
                            </button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingBeach ? 'Update Beach' : 'Create Beach')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
          <Button variant="primary" onClick={handleEditFromView}>
            <FaEdit className="me-1" /> Edit Beach
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminBeaches;
