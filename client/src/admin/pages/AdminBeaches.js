import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Badge, Modal, Table } from 'react-bootstrap';
import {
  FaSearch, FaStar, FaMapMarkerAlt, FaEye, FaImage, FaCheckCircle,
  FaMoneyBillWave, FaTag, FaCalendarAlt, FaLock, FaPlus, FaEdit, FaTrash,
  FaTimes, FaUpload, FaExclamationTriangle
} from 'react-icons/fa';
import { beachesAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

// Owner-protected beach IDs - Super Admin cannot edit/delete these
const OWNER_BEACH_IDS = [2, 7, 11];

const emptyForm = {
  name: '', location: '', region: '', price: 0, price_level: 'Budget',
  type: 'Beach', description: '',
  cottage_available: false, cottage_count: 0, cottage_price: 0,
  room_available: false, room_count: 0, room_price: 0,
  water_temp: '', weather_info: ''
};

const AdminBeaches = () => {
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewBeach, setViewBeach] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBeach, setEditBeach] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBeach, setDeleteBeach] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [addImages, setAddImages] = useState([]);

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

  const handleEdit = async (beach) => {
    try {
      const response = await beachesAPI.getById(beach.id);
      const b = response.data;
      setEditBeach(b);
      setEditForm({
        name: b.name || '',
        location: b.location || '',
        region: b.region || '',
        price: b.price || 0,
        price_level: b.price_level || '$',
        type: b.type || 'public',
        description: b.description || '',
        cottage_available: b.cottage_available || false,
        cottage_count: b.cottage_count || 0,
        cottage_price: b.cottage_price || 0,
        room_available: b.room_available || false,
        room_count: b.room_count || 0,
        room_price: b.room_price || 0,
        water_temp: b.water_temp || '',
        weather_info: b.weather_info || ''
      });
      setShowEditModal(true);
    } catch (error) {
      toast.error('Failed to load beach for editing');
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        formData.append(key, editForm[key]);
      });
      await beachesAPI.update(editBeach.id, formData);
      toast.success('Beach updated successfully');
      setShowEditModal(false);
      fetchBeaches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update beach');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSaving(true);
    try {
      await beachesAPI.delete(deleteBeach.id);
      toast.success('Beach deleted successfully');
      setShowDeleteModal(false);
      setDeleteBeach(null);
      fetchBeaches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete beach');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setAddForm({ ...emptyForm });
    setAddImages([]);
    setShowAddModal(true);
  };

  const handleAddBeach = async () => {
    if (!addForm.name || !addForm.location) {
      toast.error('Beach name and location are required');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(addForm).forEach(key => {
        formData.append(key, addForm[key]);
      });
      // Add images
      addImages.forEach(file => {
        formData.append('images', file);
      });
      await beachesAPI.create(formData);
      toast.success('Beach added successfully!');
      setShowAddModal(false);
      setAddForm({ ...emptyForm });
      setAddImages([]);
      fetchBeaches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add beach');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setAddImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setAddImages(prev => prev.filter((_, i) => i !== index));
  };

  const isOwnerBeach = (id) => OWNER_BEACH_IDS.includes(id);

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
      {/* Header */}
      <div className="admin-page-actions mb-4">
        <h2 className="admin-page-heading mb-0">Beaches Management</h2>
        <Button variant="primary" onClick={handleOpenAdd} className="d-flex align-items-center gap-2">
          <FaPlus /> Add Beach
        </Button>
      </div>

      {/* Info Banner */}
      <div className="admin-info-card mb-4" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-3" style={{ color: '#ea580c', fontSize: '1.25rem' }} />
          <div>
            <strong>Protected Beaches:</strong> Sunrise Beach (ID: 2), Caba Villa Diaz (ID: 7),
            and Tonying Beach (ID: 11) are managed by their respective beach owners.
            Super Admin can only view these beaches.
          </div>
        </div>
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
                  {isOwnerBeach(beach.id) && (
                    <Badge
                      bg="info"
                      className="position-absolute bottom-0 start-0 m-2 d-flex align-items-center gap-1"
                    >
                      <FaLock className="me-1" /> Owner Managed
                    </Badge>
                  )}
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
                      {!isOwnerBeach(beach.id) ? (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(beach)}
                            title="Edit Beach"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => { setDeleteBeach(beach); setShowDeleteModal(true); }}
                            title="Delete Beach"
                          >
                            <FaTrash />
                          </Button>
                        </>
                      ) : (
                        <Badge bg="light" text="muted" className="p-2">
                          <FaLock className="me-1" /> Protected
                        </Badge>
                      )}
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

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" /> Edit Beach: {editBeach?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Beach Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.region}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price Level</Form.Label>
                  <Form.Select
                    value={editForm.price_level}
                    onChange={(e) => setEditForm({ ...editForm, price_level: e.target.value })}
                  >
                    <option value="Budget">Budget</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Premium">Premium</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  >
                    <option value="Beach">Beach</option>
                    <option value="White Sand">White Sand</option>
                    <option value="Cove">Cove</option>
                    <option value="Resort">Resort</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Water Temperature</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.water_temp}
                    onChange={(e) => setEditForm({ ...editForm, water_temp: e.target.value })}
                    placeholder="e.g., 28°C"
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottage Count</Form.Label>
                  <Form.Control
                    type="number"
                    value={editForm.cottage_count}
                    onChange={(e) => setEditForm({ ...editForm, cottage_count: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottage Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editForm.cottage_price}
                    onChange={(e) => setEditForm({ ...editForm, cottage_price: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottages Available</Form.Label>
                  <Form.Select
                    value={editForm.cottage_available ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, cottage_available: e.target.value === 'true' })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Room Count</Form.Label>
                  <Form.Control
                    type="number"
                    value={editForm.room_count}
                    onChange={(e) => setEditForm({ ...editForm, room_count: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Room Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editForm.room_price}
                    onChange={(e) => setEditForm({ ...editForm, room_price: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Rooms Available</Form.Label>
                  <Form.Select
                    value={editForm.room_available ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, room_available: e.target.value === 'true' })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><FaCheckCircle className="me-2" />Save Changes</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrash className="me-2 text-danger" /> Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>{deleteBeach?.name}</strong>?</p>
          <p className="text-danger small">
            <FaExclamationTriangle className="me-1" />
            This will permanently delete the beach, all its images, reviews, and bookings.
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</> : <><FaTrash className="me-2" />Delete Beach</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Beach Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPlus className="me-2 text-primary" /> Add New Beach
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Beach Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Enter beach name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    placeholder="e.g., Brgy. Sabang, Allen"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    value={addForm.region}
                    onChange={(e) => setAddForm({ ...addForm, region: e.target.value })}
                    placeholder="e.g., Allen"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price Level</Form.Label>
                  <Form.Select
                    value={addForm.price_level}
                    onChange={(e) => setAddForm({ ...addForm, price_level: e.target.value })}
                  >
                    <option value="Budget">Budget</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Premium">Premium</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                  >
                    <option value="Beach">Beach</option>
                    <option value="White Sand">White Sand</option>
                    <option value="Cove">Cove</option>
                    <option value="Resort">Resort</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Water Temperature</Form.Label>
                  <Form.Control
                    type="text"
                    value={addForm.water_temp}
                    onChange={(e) => setAddForm({ ...addForm, water_temp: e.target.value })}
                    placeholder="e.g., 28°C"
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    placeholder="Describe the beach..."
                  />
                </Form.Group>
              </Col>

              {/* Cottage Info */}
              <Col xs={12}>
                <hr />
                <h6 className="text-muted mb-3">Cottage Information</h6>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottage Count</Form.Label>
                  <Form.Control
                    type="number"
                    value={addForm.cottage_count}
                    onChange={(e) => setAddForm({ ...addForm, cottage_count: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottage Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    value={addForm.cottage_price}
                    onChange={(e) => setAddForm({ ...addForm, cottage_price: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cottages Available</Form.Label>
                  <Form.Select
                    value={addForm.cottage_available ? 'true' : 'false'}
                    onChange={(e) => setAddForm({ ...addForm, cottage_available: e.target.value === 'true' })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Room Info */}
              <Col xs={12}>
                <hr />
                <h6 className="text-muted mb-3">Room Information</h6>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Room Count</Form.Label>
                  <Form.Control
                    type="number"
                    value={addForm.room_count}
                    onChange={(e) => setAddForm({ ...addForm, room_count: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Room Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    value={addForm.room_price}
                    onChange={(e) => setAddForm({ ...addForm, room_price: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Rooms Available</Form.Label>
                  <Form.Select
                    value={addForm.room_available ? 'true' : 'false'}
                    onChange={(e) => setAddForm({ ...addForm, room_available: e.target.value === 'true' })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Images */}
              <Col xs={12}>
                <hr />
                <h6 className="text-muted mb-3">Beach Images</h6>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Upload Images</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                  <Form.Text className="text-muted">
                    You can select multiple images. First image will be the primary image.
                  </Form.Text>
                </Form.Group>
              </Col>
              {addImages.length > 0 && (
                <Col xs={12}>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {addImages.map((file, index) => (
                      <div key={index} className="position-relative" style={{ width: '100px', height: '80px' }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        {index === 0 && (
                          <Badge bg="success" className="position-absolute top-0 start-0 m-1" style={{ fontSize: '0.65rem' }}>
                            Primary
                          </Badge>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-1 p-0"
                          style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}
                          onClick={() => removeImage(index)}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddBeach} disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2" />Adding...</>
            ) : (
              <><FaPlus className="me-2" />Add Beach</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminBeaches;
