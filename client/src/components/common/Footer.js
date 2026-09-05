import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaTwitter, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row className="g-5">
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <span style={{ fontSize: '2rem' }}>🌊</span>
              <span className="fw-bold fs-3">Allen<span style={{ color: '#90e0ef' }}>Shores</span></span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Discover the best beaches in Allen, Northern Samar. Compare, review, and book your perfect beach getaway with confidence.
            </p>
            <div className="d-flex gap-3 mt-4">
              <a 
                href="#" 
                className="text-white fs-4" 
                style={{ 
                  width: '45px', 
                  height: '45px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(144, 224, 239, 0.15)',
                  borderRadius: '12px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(144, 224, 239, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(144, 224, 239, 0.15)'}
              >
                <FaFacebook />
              </a>
              <a 
                href="#" 
                className="text-white fs-4"
                style={{ 
                  width: '45px', 
                  height: '45px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(144, 224, 239, 0.15)',
                  borderRadius: '12px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(144, 224, 239, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(144, 224, 239, 0.15)'}
              >
                <FaInstagram />
              </a>
              <a 
                href="#" 
                className="text-white fs-4"
                style={{ 
                  width: '45px', 
                  height: '45px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(144, 224, 239, 0.15)',
                  borderRadius: '12px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(144, 224, 239, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(144, 224, 239, 0.15)'}
              >
                <FaTwitter />
              </a>
            </div>
          </Col>
          
          <Col lg={2} md={6}>
            <h6 className="fw-bold mb-4">Explore</h6>
            <ul className="list-unstyled" style={{ fontSize: '0.95rem' }}>
              <li className="mb-3"><Link to="/">Home</Link></li>
              <li className="mb-3"><Link to="/beaches">Beaches</Link></li>
              <li className="mb-3"><Link to="/compare">Compare</Link></li>
              <li className="mb-3"><Link to="/booking">Book Now</Link></li>
              <li className="mb-3"><Link to="/reviews">Reviews</Link></li>
            </ul>
          </Col>
          
          <Col lg={3} md={6}>
            <h6 className="fw-bold mb-4">Top Beaches</h6>
            <ul className="list-unstyled" style={{ fontSize: '0.95rem' }}>
              <li className="mb-3"><Link to="/beaches">White Sand Beach</Link></li>
              <li className="mb-3"><Link to="/beaches">Coral Beach Resort</Link></li>
              <li className="mb-3"><Link to="/beaches">Sunset Cove</Link></li>
              <li className="mb-3"><Link to="/beaches">Paradise Bay</Link></li>
            </ul>
          </Col>
          
          <Col lg={3} md={6}>
            <h6 className="fw-bold mb-4">Contact</h6>
            <ul className="list-unstyled" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
              <li className="mb-3 d-flex align-items-start gap-3">
                <FaMapMarkerAlt style={{ color: '#90e0ef', marginTop: '4px' }} />
                <span>Allen, Northern Samar, Philippines</span>
              </li>
              <li className="mb-3 d-flex align-items-center gap-3">
                <FaEnvelope style={{ color: '#90e0ef' }} />
                <span>info@allenshores.ph</span>
              </li>
              <li className="mb-3 d-flex align-items-center gap-3">
                <FaPhone style={{ color: '#90e0ef' }} />
                <span>+63 912 345 6789</span>
              </li>
            </ul>
          </Col>
        </Row>
        
        <hr style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '3rem 0 1.5rem' }} />
        
        <Row>
          <Col className="text-center" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            <p className="mb-0">© {currentYear} AllenShores PH. All rights reserved. Made with ❤️ in Northern Samar</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
