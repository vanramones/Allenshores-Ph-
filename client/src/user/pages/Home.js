import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import { FaSearch, FaUmbrellaBeach, FaBalanceScale, FaStar, FaCalendarCheck, FaMapMarkerAlt } from 'react-icons/fa';
import { beachesAPI } from '../../services/api';
import BeachCard from '../../components/beaches/BeachCard';
import Loading from '../../components/common/Loading';

const Home = () => {
  const [featuredBeaches, setFeaturedBeaches] = useState([]);
  const [stats, setStats] = useState({ totalBeaches: 0, totalReviews: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [beachesRes, statsRes] = await Promise.all([
        beachesAPI.getFeatured(),
        beachesAPI.getStats()
      ]);
      setFeaturedBeaches(beachesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/beaches?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/beaches');
    }
  };

  const features = [
    { 
      icon: <FaSearch size={24} />, 
      title: 'Smart Search', 
      desc: 'Filter beaches by location, rating, price, and beach type to find your ideal match.',
      color: '#00b4d8',
      bgColor: '#e0f7fa'
    },
    { 
      icon: <FaBalanceScale size={24} />, 
      title: 'Side-by-Side Compare', 
      desc: 'Compare up to 3 beaches simultaneously across 12+ attributes including safety and cleanliness.',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    { 
      icon: <FaStar size={24} />, 
      title: 'Real Reviews', 
      desc: 'Read authentic traveler reviews with star ratings to make informed decisions.',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    { 
      icon: <FaCalendarCheck size={24} />, 
      title: 'Easy Booking', 
      desc: 'Reserve your beach visit with our simple booking form — quick and hassle-free.',
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    }
  ];

  return (
    <div className="user-home fade-in">
      {/* Hero Section with Beach Background */}
      <section className="hero-section-new">
        <div className="hero-overlay"></div>
        <Container className="hero-content">
          <Row className="align-items-center min-vh-75">
            <Col lg={7} className="text-white">
              <div className="hero-badge mb-3">
                <FaMapMarkerAlt className="me-2" />
                Allen, Northern Samar's Beach Discovery Platform
              </div>
              <h1 className="hero-title mb-4">
                Discover<br />
                <span className="text-gradient-orange">Allen, Northern</span><br />
                <span className="text-gradient-orange">Samar</span> Beaches
              </h1>
              <p className="hero-subtitle mb-4">
                Explore, compare, and book the most breathtaking beaches in Allen, Northern Samar. Real reviews, honest ratings, and unforgettable adventures await.
              </p>
              
              {/* Stats Row */}
              <Row className="stats-row mb-4">
                <Col xs={3}>
                  <div className="stat-item">
                    <h3 className="stat-number">{stats.totalBeaches}</h3>
                    <span className="stat-label">Beaches</span>
                  </div>
                </Col>
                <Col xs={3}>
                  <div className="stat-item">
                    <h3 className="stat-number">{stats.totalReviews}</h3>
                    <span className="stat-label">Reviews</span>
                  </div>
                </Col>
                <Col xs={3}>
                  <div className="stat-item">
                    <h3 className="stat-number">1</h3>
                    <span className="stat-label">Region</span>
                  </div>
                </Col>
                <Col xs={3}>
                  <div className="stat-item">
                    <h3 className="stat-number">100%</h3>
                    <span className="stat-label">Free</span>
                  </div>
                </Col>
              </Row>

              {/* CTA Buttons */}
              <div className="hero-buttons">
                <Link to="/beaches" className="btn btn-explore me-3">
                  <FaSearch className="me-2" />
                  Explore Beaches
                </Link>
                <Link to="/compare" className="btn btn-compare">
                  <FaBalanceScale className="me-2" />
                  Compare Now
                </Link>
              </div>
            </Col>

            {/* Search Card */}
            <Col lg={5} className="mt-4 mt-lg-0">
              <Card className="search-card">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <FaSearch className="me-2 text-primary" />
                    Quick Beach Search
                  </h5>
                  <Form onSubmit={handleSearch}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted small fw-semibold">Destination or Beach Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Boracay, Palawan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                      />
                    </Form.Group>
                    <Button type="submit" className="btn-find-beaches w-100">
                      <FaUmbrellaBeach className="me-2" />
                      Find Beaches
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        
        {/* Wave SVG */}
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f0f9ff"/>
          </svg>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="section-title-new fw-bold">Why Choose AllenShores PH?</h2>
            <div className="title-underline mx-auto"></div>
            <p className="section-subtitle mt-3">Everything you need to plan your perfect beach getaway</p>
          </div>
          <Row className="g-4">
            {features.map((feature, index) => (
              <Col md={6} lg={3} key={index}>
                <Card className="feature-card-new h-100 text-center">
                  <Card.Body className="p-4">
                    <div 
                      className="feature-icon-circle mx-auto mb-3"
                      style={{ backgroundColor: feature.bgColor, color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                    <h5 className="fw-bold mb-3">{feature.title}</h5>
                    <p className="text-muted small mb-0">{feature.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Featured Beaches Section */}
      <section className="featured-section py-5">
        <Container>
          <div className="text-center mb-5">
            <span className="top-rated-badge">Top Rated</span>
            <h2 className="section-title-new fw-bold mt-3">Featured Beaches</h2>
            <div className="title-underline mx-auto"></div>
            <p className="section-subtitle mt-3">Handpicked paradise destinations with the highest traveler ratings</p>
          </div>
          
          {loading ? (
            <Loading text="Loading beaches..." />
          ) : (
            <>
              <Row className="g-4">
                {featuredBeaches.map((beach, index) => (
                  <Col md={6} lg={4} key={beach.id}>
                    <div style={{ animationDelay: `${index * 0.1}s` }} className="fade-in">
                      <BeachCard beach={beach} />
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="text-center mt-5">
                <Link to="/beaches" className="btn btn-view-all">
                  <FaUmbrellaBeach className="me-2" />
                  View All Beaches
                </Link>
              </div>
            </>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section-new py-5">
        <Container className="text-center">
          <div className="beach-ball-icon mb-4">🏖️</div>
          <h2 className="cta-title fw-bold text-white mb-3">Can't Decide? Compare Beaches!</h2>
          <p className="cta-subtitle text-white-50 mb-4">
            Select up to 3 beaches and see a detailed side-by-side comparison of<br />
            all key attributes to make the best choice.
          </p>
          <div className="cta-buttons">
            <Link to="/compare" className="btn btn-cta-primary me-3">
              <FaBalanceScale className="me-2" />
              Start Comparing
            </Link>
            <Link to="/booking" className="btn btn-cta-secondary">
              <FaCalendarCheck className="me-2" />
              Book a Beach
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Home;
