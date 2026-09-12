import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import {
  FaEdit, FaSave, FaTimes, FaImage, FaCheckCircle,
  FaHome, FaBed, FaThermometerHalf, FaMapMarkerAlt, FaTag,
  FaMoneyBillWave, FaStar, FaCalendarAlt
} from 'react-icons/fa';
import { ownerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/common/Loading';
import PropertyManager from '../components/PropertyManager';
import { toast } from 'react-toastify';

const OwnerBeachEdit = () => {
  const { owner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [beach, setBeach] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    region: 'Allen',
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

  useEffect(() => {
    fetchBeach();
  }, []);

  const fetchBeach = async () => {
    try {
      const response = await ownerAPI.getBeach();
      const fullBeach = response.data;
      setBeach(fullBeach);
      setFormData({
        name: fullBeach.name || '',
        location: fullBeach.location || '',
        region: fullBeach.region || 'Allen',
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
      console.error('Error fetching beach:', error);
      toast.error('Failed to load beach details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
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

      await ownerAPI.updateBeach(data);
      toast.success('Beach updated successfully');
      fetchBeach();
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update beach');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80';

  if (loading) return <Loading text="Loading your beach..." />;

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaEdit className="me-2" style={{ color: '#0f766e' }} />
            Edit My Beach
          </h2>
          <p className="text-muted mb-0">
            Update your beach details, images, and amenities
          </p>
        </div>
        <Badge bg="info" className="p-2">
          Owner: {owner?.username}
        </Badge>
      </div>

      <Form onSubmit={handleSubmit}>
        {/* Beach Info Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white py-3">
          <h5 className="mb-0 fw-bold">
          <FaMapMarkerAlt className="me-2 text-primary" />
          Beach Information
          </h5>
          </Card.Header>
          <Card.Body>
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
                  <Form.Label>Price (₱)</Form.Label>
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
                    placeholder="Describe your beach..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Cottage Availability Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <FaHome className="me-2 text-success" />
              Cottage Availability
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
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
            </Row>
          </Card.Body>
        </Card>

        {/* Room Availability Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <FaBed className="me-2 text-info" />
              Room Availability
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
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
            </Row>
          </Card.Body>
        </Card>

        {/* Weather & Temperature Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <FaThermometerHalf className="me-2 text-warning" />
              Weather & Water Temperature
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
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
            </Row>
          </Card.Body>
        </Card>

        {/* Image Management Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0 fw-bold">
              <FaImage className="me-2 text-primary" />
              Beach Images
            </h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Upload New Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="admin-image-input"
              />
              <Form.Text className="text-muted">
                You can upload multiple images. Max 5MB per image.
              </Form.Text>
            </Form.Group>

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="admin-image-preview-list mb-3">
                <p className="admin-image-section-title">New Images (not yet saved)</p>
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
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="admin-image-preview-list">
                <p className="admin-image-section-title">Current Images</p>
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

            {existingImages.length === 0 && imagePreviews.length === 0 && (
              <div className="text-center py-4 text-muted">
                <FaImage size={48} className="mb-2" />
                <p>No images uploaded yet</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Submit Button */}
        <div className="d-flex gap-2 justify-content-end mb-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              fetchBeach();
              setImageFiles([]);
              setImagePreviews([]);
              toast.info('Changes discarded');
            }}
          >
            <FaTimes className="me-1" /> Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            style={{ background: '#0f766e', borderColor: '#0f766e' }}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="me-1" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </Form>

      {/* Cottage & Room Management */}
      {beach && (
        <>
          <PropertyManager type="cottage" beachId={beach.id} />
          <PropertyManager type="room" beachId={beach.id} />
        </>
      )}
    </div>
  );
};

export default OwnerBeachEdit;
