import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaEye, FaEyeSlash, FaUser, FaLock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { ownerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const OwnerAdminAccounts = ({ theme }) => {
  const { owner } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'staff',
    is_active: true
  });

  const themeColor = theme?.primary || '#0f766e';

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await ownerAPI.getAdmins();
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setFormData({ username: '', password: '', full_name: '', email: '', role: 'staff', is_active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '',
      full_name: admin.full_name,
      email: admin.email || '',
      role: admin.role,
      is_active: admin.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAdmin) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await ownerAPI.updateAdmin(editingAdmin.id, updateData);
        toast.success('Admin account updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new accounts');
          setSaving(false);
          return;
        }
        await ownerAPI.createAdmin(formData);
        toast.success('Admin account created successfully');
      }
      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error saving admin:', error);
      toast.error(error.response?.data?.message || 'Failed to save admin account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await ownerAPI.deleteAdmin(deleteId);
      toast.success('Admin account deleted successfully');
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin account');
    }
  };

  if (loading) return <Loading text="Loading admin accounts..." />;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <FaUserShield className="me-2" style={{ color: themeColor }} />
            Admin Accounts
          </h2>
          <p className="text-muted mb-0">
            Manage staff accounts for {(owner?.beach_name || 'your beach').replace(/\s*Updated\s*$/i, '')}
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          style={{ background: themeColor, borderColor: themeColor }}
        >
          <FaPlus className="me-2" /> Add Admin
        </Button>
      </div>

      {/* Info Card */}
      <div className="admin-info-card mb-4" style={{ background: themeColor + '10', borderColor: themeColor + '30' }}>
        <div className="d-flex align-items-center">
          <FaUserShield className="me-3" style={{ color: themeColor, fontSize: '1.5rem' }} />
          <div>
            <strong>Staff Login Info:</strong> Created accounts can login via the Beach Owner portal
            using their username and password. They will have access to the same beach management features.
          </div>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <div className="owner-stat-card owner-stat-primary" style={{ borderRadius: '12px', padding: '1rem' }}>
            <div className="d-flex align-items-center gap-2">
              <FaUserShield style={{ fontSize: '1.5rem', color: themeColor }} />
              <div>
                <div className="fw-bold fs-5">{admins.length}</div>
                <small className="text-muted">Total Accounts</small>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="owner-stat-card owner-stat-success" style={{ borderRadius: '12px', padding: '1rem' }}>
            <div className="d-flex align-items-center gap-2">
              <FaCheckCircle style={{ fontSize: '1.5rem', color: '#059669' }} />
              <div>
                <div className="fw-bold fs-5">{admins.filter(a => a.is_active).length}</div>
                <small className="text-muted">Active</small>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="owner-stat-card owner-stat-warning" style={{ borderRadius: '12px', padding: '1rem' }}>
            <div className="d-flex align-items-center gap-2">
              <FaTimesCircle style={{ fontSize: '1.5rem', color: '#d97706' }} />
              <div>
                <div className="fw-bold fs-5">{admins.filter(a => !a.is_active).length}</div>
                <small className="text-muted">Inactive</small>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <div className="admin-table-wrapper">
        <Table responsive className="admin-table">
          <thead>
            <tr>
              <th>Admin Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-5">
                  <FaUserShield style={{ fontSize: '3rem', color: '#cbd5e1' }} className="mb-3 d-block mx-auto" />
                  <h5>No admin accounts yet</h5>
                  <p>Click "Add Admin" to create staff accounts for your beach.</p>
                </td>
              </tr>
            ) : (
              admins.map(admin => (
                <tr key={admin.id}>
                  <td data-label="Admin Name">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="owner-guest-avatar"
                        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${theme?.primaryLight || '#14b8a6'} 100%)`, width: '36px', height: '36px', fontSize: '0.85rem' }}
                      >
                        {admin.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="fw-semibold">{admin.full_name}</div>
                    </div>
                  </td>
                  <td data-label="Username"><code>{admin.username}</code></td>
                  <td data-label="Email">{admin.email || 'N/A'}</td>
                  <td data-label="Role">
                    <Badge
                      bg={admin.role === 'admin' ? 'primary' : 'info'}
                      className="text-capitalize"
                    >
                      {admin.role}
                    </Badge>
                  </td>
                  <td data-label="Status">
                    <Badge bg={admin.is_active ? 'success' : 'danger'}>
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td data-label="Created">{new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td data-label="Actions">
                    <div className="d-flex gap-1">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleOpenEdit(admin)}
                        title="Edit"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => { setDeleteId(admin.id); setShowDeleteModal(true); }}
                        title="Delete"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUserShield className="me-2" style={{ color: themeColor }} />
            {editingAdmin ? 'Edit Admin Account' : 'Add Admin Account'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label><FaUser className="me-1" /> Full Name *</Form.Label>
              <Form.Control
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaUser className="me-1" /> Username *</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username for login"
                required
                disabled={editingAdmin}
              />
              {editingAdmin && (
                <Form.Text className="text-muted">Username cannot be changed</Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaLock className="me-1" /> Password {editingAdmin ? '(leave blank to keep current)' : '*'}
              </Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingAdmin ? 'Leave blank to keep current' : 'Enter password'}
                  required={!editingAdmin}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email (optional)"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} style={{ background: themeColor, borderColor: themeColor }}>
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
              ) : (
                <>{editingAdmin ? 'Update Account' : 'Create Account'}</>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this admin account? This action cannot be undone.
          The account will no longer be able to login.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete Account</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OwnerAdminAccounts;
