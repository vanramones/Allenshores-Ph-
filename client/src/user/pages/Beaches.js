import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Form, InputGroup, Button, Alert } from 'react-bootstrap';
import { FaSearch, FaFilter, FaStar, FaBalanceScale } from 'react-icons/fa';
import { beachesAPI } from '../../services/api';
import BeachCard from '../../components/beaches/BeachCard';
import Loading from '../../components/common/Loading';
import { useCompare } from '../../context/CompareContext';
import { useBookmarks } from '../../context/BookmarkContext';
import { Link } from 'react-router-dom';

const Beaches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    rating: searchParams.get('rating') || '',
    price_level: searchParams.get('price_level') || '',
    sort: searchParams.get('sort') || ''
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  
  const { compareCount, compareList } = useCompare();
  const { bookmarkedIds } = useBookmarks();

  useEffect(() => {
    fetchBeaches();
  }, [filters]);

  const fetchBeaches = async () => {
    setLoading(true);
    try {
      const response = await beachesAPI.getAll(filters);
      setBeaches(response.data);
    } catch (error) {
      console.error('Error fetching beaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBeaches();
  };

  const clearFilters = () => {
    setFilters({ search: '', rating: '', price_level: '', sort: '' });
    setSearchParams({});
  };

  const displayedBeaches = showBookmarksOnly 
    ? beaches.filter(b => bookmarkedIds.has(b.id))
    : beaches;

  return (
    <div className="user-beaches fade-in py-4">
      <Container>
        {/* Header */}
        <div className="mb-5 text-center">
          <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem' }}>Explore Beaches</h1>
          <p className="text-muted" style={{ fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
            Discover the perfect beach for your next adventure in Allen, Northern Samar
          </p>
        </div>

        {/* Compare Alert */}
        {compareCount > 0 && (
          <Alert 
            variant="info" 
            className="d-flex justify-content-between align-items-center mb-4"
            style={{ 
              borderRadius: '16px',
              border: '1px solid rgba(0, 119, 182, 0.2)',
              background: 'linear-gradient(135deg, rgba(0, 119, 182, 0.05), rgba(0, 180, 216, 0.05))',
              padding: '1.25rem'
            }}
          >
            <span style={{ fontWeight: 500 }}>
              <FaBalanceScale className="me-2" style={{ color: 'var(--primary)' }} />
              {compareCount} beach{compareCount > 1 ? 'es' : ''} selected for comparison
            </span>
            <Link to="/compare" className="btn btn-primary btn-sm">
              Compare Now
            </Link>
          </Alert>
        )}

        {/* Filters */}
        <div className="glass-card rounded-4 p-4 mb-5" style={{ borderRadius: '20px' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <FaFilter style={{ color: 'var(--primary)' }} />
            <h5 className="mb-0 fw-bold">Filter & Search</h5>
          </div>
          <Form onSubmit={handleSearch}>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>
                  Search
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Beach name or location..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    style={{ borderRadius: '12px 0 0 12px', padding: '0.65rem 1rem' }}
                  />
                  <Button 
                    variant="primary" 
                    type="submit"
                    style={{ borderRadius: '0 12px 12px 0', padding: '0.65rem 1.25rem' }}
                  >
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Col>
              
              <Col md={2}>
                <Form.Label className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>
                  Min Rating
                </Form.Label>
                <Form.Select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  style={{ borderRadius: '12px', padding: '0.65rem 1rem' }}
                >
                  <option value="">Any</option>
                  <option value="4.5">4.5+ ⭐</option>
                  <option value="4.7">4.7+ ⭐</option>
                  <option value="4.8">4.8+ ⭐</option>
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <Form.Label className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>
                  Price Level
                </Form.Label>
                <Form.Select
                  value={filters.price_level}
                  onChange={(e) => handleFilterChange('price_level', e.target.value)}
                  style={{ borderRadius: '12px', padding: '0.65rem 1rem' }}
                >
                  <option value="">Any</option>
                  <option value="Budget">Budget</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Premium">Premium</option>
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <Form.Label className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>
                  Sort By
                </Form.Label>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  style={{ borderRadius: '12px', padding: '0.65rem 1rem' }}
                >
                  <option value="">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name A-Z</option>
                  <option value="reviews">Most Reviews</option>
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <div className="d-flex flex-column gap-2">
                  <Form.Check
                    type="switch"
                    id="bookmarks-only"
                    label="Bookmarks Only"
                    checked={showBookmarksOnly}
                    onChange={(e) => setShowBookmarksOnly(e.target.checked)}
                    className="mb-0"
                    style={{ fontWeight: 500 }}
                  />
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={clearFilters}
                    style={{ borderRadius: '10px' }}
                  >
                    Clear All
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Results */}
        {loading ? (
          <Loading text="Loading beaches..." />
        ) : displayedBeaches.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏖️</div>
            <h3 className="fw-bold mb-3">No beaches found</h3>
            <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
              Try adjusting your filters or search terms
            </p>
            <Button variant="primary" onClick={clearFilters} className="px-4">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <p className="text-muted mb-0" style={{ fontSize: '1rem', fontWeight: 500 }}>
                Showing <strong style={{ color: 'var(--primary)' }}>{displayedBeaches.length}</strong> beach{displayedBeaches.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <Row className="g-4">
              {displayedBeaches.map((beach, index) => (
                <Col md={6} lg={4} key={beach.id}>
                  <div style={{ animationDelay: `${index * 0.05}s` }} className="fade-in">
                    <BeachCard beach={beach} />
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default Beaches;
