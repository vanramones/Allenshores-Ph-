import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUserShield } from 'react-icons/fa';
import { adminsAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const AdminAccounts = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await adminsAPI.getAll();
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        username: admin.username,
        password: '',
        confirmPassword: ''
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        username: '',
        password: '',
        confirmPassword: ''
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingAdmin && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!editingAdmin && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      if (editingAdmin) {
        await adminsAPI.update(editingAdmin.id, {
          username: formData.username,
          password: formData.password || undefined
        });
        toast.success('Admin updated successfully');
      } else {
        await adminsAPI.create({
          username: formData.username,
          password: formData.password
        });
        toast.success('Admin created successfully');
      }
      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    try {
      await adminsAPI.delete(id);
      toast.success('Admin deleted');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <Loading text="Loading admins..." />;

  return (
    <div className="admin-accounts fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Admin Accounts</h2>
        <Button variant="primary" onClick={() => openModal()}>
          <FaPlus className="me-2" />
          Add Admin
        </Button>
      </div>

      <Card>
        <Card.Body className="p-0">
          {admins.length === 0 ? (
            <div className="text-center py-5">
              <FaUserShield size={48} className="text-muted mb-3" />
              <h5>No admin accounts found</h5>
              <Button variant="primary" onClick={() => openModal()}>
                Add First Admin
              </Button>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} onClick={() => openModal(admin)} style={{ cursor: 'pointer' }}>
                    <td>{admin.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: 32, 
                            height: 32, 
                            background: 'linear-gradient(135deg, #0077b6, #023e8a)',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {admin.username.charAt(0).toUpperCase()}
                        </div>
                        <strong>{admin.username}</strong>
                      </div>
                    </td>
                    <td>{formatDate(admin.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openModal(admin)}
                          title="Edit"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
                          title="Delete"
                          disabled={admins.length <= 1}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter username"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {editingAdmin ? 'New Password (leave blank to keep current)' : 'Password *'}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!editingAdmin}
                placeholder="Enter password"
                minLength={6}
              />
            </Form.Group>

            {!editingAdmin && (
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password *</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingAdmin ? 'Update Admin' : 'Create Admin')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAccounts;
