import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaHome, FaBed, FaImage
} from 'react-icons/fa';
import { propertiesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PropertyManager = ({ type, beachId, beachName, icon, color }) => {
  const typeName = type.charAt(0).toUpperCase() + type.slice(1) + 's';
  const Icon = icon || (type === 'cottage' ? FaHome : FaBed);
  const accent = color || (type === 'cottage' ? '#16a34a' : '#0ea5e9');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const emptyForm = { name: '', description: '', price: '', capacity: 2, quantity: 1, is_available: true };
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [primaryImageId, setPrimaryImageId] = useState(null);

  useEffect(() => {
    if (beachId) fetchItems();
  }, [beachId]);

  const fetchItems = async () => {
    if (!beachId) return;
    try {
      setLoading(true);
      const res = await propertiesAPI.getForManage(type, beachId);
      setItems(res.data);
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setDeletedImages([]);
    setPrimaryImageId(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      capacity: item.capacity || 2,
      quantity: item.quantity || 1,
      is_available: item.is_available !== false
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages(item.images || []);
    setDeletedImages([]);
    setPrimaryImageId(item.images?.find(i => i.is_primary)?.id || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index) => {
    const nf = [...imageFiles]; const np = [...imagePreviews];
    if (np[index]) URL.revokeObjectURL(np[index]);
    nf.splice(index, 1); np.splice(index, 1);
    setImageFiles(nf); setImagePreviews(np);
  };

  const removeExistingImage = (imageId) => {
    setDeletedImages(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(i => i.id !== imageId));
    if (primaryImageId === imageId) {
      const remaining = existingImages.filter(i => i.id !== imageId);
      setPrimaryImageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      // Auto-generate name from beach name + type if not editing existing
      const autoName = editing ? form.name : `${beachName || ''} ${typeName.replace('s', '')}`.trim();
      data.append('name', autoName);
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'name') data.append(k, v);
      });
      data.append('beach_id', beachId);
      imageFiles.forEach(f => data.append('images', f));
      if (deletedImages.length > 0) data.append('deletedImages', JSON.stringify(deletedImages));
      if (primaryImageId) data.append('primaryImageId', primaryImageId);

      if (editing) {
        await propertiesAPI.update(type, editing.id, data);
        toast.success(`${typeName.replace('s', '')} updated successfully`);
      } else {
        await propertiesAPI.create(type, data);
        toast.success(`${typeName.replace('s', '')} added successfully`);
      }
      setShowModal(false);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to save ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await propertiesAPI.delete(type, deleteTarget.id);
      toast.success(`${typeName.replace('s', '')} deleted successfully`);
      setShowDelete(false);
      setDeleteTarget(null);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const defaultImg = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80';

  return (
    <Card className="mb-4 border-0 shadow-sm">
      <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">
          <Icon className="me-2" style={{ color: accent }} />
          {typeName} Management
        </h5>
        <Button size="sm" style={{ background: accent, borderColor: accent }} onClick={openAdd}>
          <FaPlus className="me-1" /> Add {typeName.replace('s', '')}
        </Button>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <p className="text-muted text-center py-3">Loading {type}s...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <Icon size={40} className="mb-2" />
            <p>No {type}s added yet</p>
          </div>
        ) : (
          <Row className="g-3">
            {items.map(item => {
              const primaryImg = item.images?.find(i => i.is_primary) || item.images?.[0];
              return (
                <Col xs={12} sm={6} lg={4} key={item.id}>
                  <div className="admin-image-preview-wrap" style={{ display: 'block' }}>
                    <img
                      src={primaryImg?.image_path || defaultImg}
                      alt={item.name}
                      className="admin-image-preview"
                      style={{ height: '140px', width: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = defaultImg; }}
                    />
                    <div className="p-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <strong>{item.name}</strong>
                        <Badge bg={item.is_available === false ? 'secondary' : 'success'}>
                          {item.is_available === false ? 'Hidden' : 'Available'}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between mt-2 small text-muted">
                        <span>₱{item.price}</span>
                        <span>Cap: {item.capacity} | Qty: {item.quantity}</span>
                      </div>
                      {item.description && (
                        <p className="small text-muted mt-1 mb-2" style={{ minHeight: '2.4em', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                      )}
                      <div className="d-flex gap-1 mt-2">
                        <Button size="sm" variant="outline-primary" onClick={() => openEdit(item)}>
                          <FaEdit /> Edit
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => { setDeleteTarget(item); setShowDelete(true); }}>
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Card.Body>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? <><FaEdit className="me-2" />Edit {typeName.replace('s', '')}</> : <><FaPlus className="me-2" />Add {typeName.replace('s', '')}</>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              {editing && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={`e.g., ${type === 'cottage' ? 'Beachfront Cottage' : 'Deluxe Room'}`}
                    />
                  </Form.Group>
                </Col>
              )}
              {!editing && (
                <Col xs={12}>
                  <div className="p-3 rounded mb-2" style={{ background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
                    <small className="text-muted">Name will be auto-generated:</small>
                    <div className="fw-bold mt-1" style={{ color: accent }}>
                      {beachName} {typeName.replace('s', '')}
                    </div>
                  </div>
                </Col>
              )}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g., 300"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Capacity (pax)</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Quantity Available</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>&nbsp;</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Available to book"
                    checked={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe this property..."
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label><FaImage className="me-1" /> Images</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="admin-image-input"
                  />
                  <Form.Text className="text-muted">Max 5MB per image. First image becomes primary.</Form.Text>
                </Form.Group>
              </Col>

              {/* New image previews */}
              {imagePreviews.length > 0 && (
                <Col xs={12}>
                  <p className="admin-image-section-title">New Images</p>
                  <Row className="g-2">
                    {imagePreviews.map((preview, index) => (
                      <Col xs={6} md={3} key={index}>
                        <div className="admin-image-preview-wrap">
                          <img src={preview} alt={`New ${index + 1}`} className="admin-image-preview" />
                          <button type="button" className="admin-image-remove" onClick={() => removeNewImage(index)}>
                            <FaTimes />
                          </button>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Col>
              )}

              {/* Existing images */}
              {existingImages.length > 0 && (
                <Col xs={12}>
                  <p className="admin-image-section-title">Current Images</p>
                  <Row className="g-2">
                    {existingImages.map(img => (
                      <Col xs={6} md={3} key={img.id}>
                        <div className={`admin-image-preview-wrap ${primaryImageId === img.id ? 'is-primary' : ''}`}>
                          <img src={img.image_path} alt={`Img ${img.id}`} className="admin-image-preview" />
                          <button type="button" className="admin-image-remove" onClick={() => removeExistingImage(img.id)}>
                            <FaTimes />
                          </button>
                          <button
                            type="button"
                            className="admin-image-primary-btn"
                            onClick={() => setPrimaryImageId(img.id)}
                            title="Set as primary"
                          >
                            {primaryImageId === img.id ? <><FaCheckCircle className="me-1" /> Primary</> : 'Set Primary'}
                          </button>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete {typeName.replace('s', '')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also remove all its images.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default PropertyManager;
