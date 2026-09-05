import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaBookmark, FaUmbrellaBeach } from 'react-icons/fa';
import { useBookmarks } from '../../context/BookmarkContext';
import BeachCard from '../../components/beaches/BeachCard';
import Loading from '../../components/common/Loading';

const Bookmarks = () => {
  const { bookmarks, loading } = useBookmarks();

  if (loading) {
    return <Loading text="Loading bookmarks..." />;
  }

  if (bookmarks.length === 0) {
    return (
      <div className="user-bookmarks fade-in py-4">
        <Container className="text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔖</div>
          <h2 className="fw-bold mb-3">No Bookmarks Yet</h2>
          <p className="text-muted mb-4">
            Save your favorite beaches to easily find them later
          </p>
          <Link to="/beaches" className="btn btn-primary btn-lg">
            <FaUmbrellaBeach className="me-2" />
            Browse Beaches
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="user-bookmarks fade-in py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-1">
              <FaBookmark className="me-2 text-danger" />
              My Bookmarks
            </h1>
            <p className="text-muted mb-0">
              {bookmarks.length} saved beach{bookmarks.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <Link to="/beaches" className="btn btn-outline-primary">
            Browse More
          </Link>
        </div>

        <Row className="g-4">
          {bookmarks.map(bookmark => (
            <Col md={6} lg={4} key={bookmark.id}>
              <BeachCard beach={{
                id: bookmark.beach_id,
                name: bookmark.name,
                location: bookmark.location,
                rating: bookmark.rating,
                price: bookmark.price,
                price_level: bookmark.price_level,
                type: bookmark.type,
                image: bookmark.image
              }} />
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default Bookmarks;
