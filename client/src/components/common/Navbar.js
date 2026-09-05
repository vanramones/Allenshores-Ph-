import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Badge, Form, Button, InputGroup, Spinner } from 'react-bootstrap';
import { FaHome, FaUmbrellaBeach, FaBalanceScale, FaBookmark, FaStar, FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
import { useBookmarks } from '../../context/BookmarkContext';
import { useCompare } from '../../context/CompareContext';
import { beachesAPI } from '../../services/api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { bookmarkCount } = useBookmarks();
  const { compareCount } = useCompare();
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Update navbar search if on Beaches page with search param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    if (location.pathname === '/beaches') {
      setSearchQuery(search);
    }
  }, [location.pathname, location.search]);

  // Fetch suggestions on type
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = searchQuery.trim();
    if (query.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await beachesAPI.getAll({ search: query, limit: 6 });
        setSuggestions(response.data);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch (error) {
        console.error('Search suggestions error:', error);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/beaches?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/beaches');
    }
  };

  const handleSelectSuggestion = (beach) => {
    setSearchQuery(beach.name);
    setShowSuggestions(false);
    navigate(`/beaches/${beach.id}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&q=80';

  return (
    <BSNavbar expand="lg" sticky="top" className="navbar-custom py-2">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <div className="brand-icon">
            <span>🌊</span>
          </div>
          <div className="brand-text">
            <span className="brand-allen">Allen</span>
            <span className="brand-shores">Shores</span>
            <span className="brand-ph"> PH</span>
          </div>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="main-navbar" />
        
        <BSNavbar.Collapse id="main-navbar">
          <Form
            onSubmit={handleSubmit}
            className="d-flex mx-auto my-2 my-lg-0 nav-search-form position-relative"
            ref={searchRef}
          >
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search beaches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                className="nav-search-input"
                autoComplete="off"
              />
              <Button variant="primary" type="submit" className="nav-search-btn">
                {loading ? <Spinner as="span" animation="border" size="sm" /> : <FaSearch />}
              </Button>
            </InputGroup>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="nav-suggestions-dropdown">
                <div className="nav-suggestions-header">
                  {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
                </div>
                {suggestions.map((beach, index) => (
                  <div
                    key={beach.id}
                    className={`nav-suggestion-item ${index === activeIndex ? 'active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelectSuggestion(beach)}
                  >
                    <img
                      src={beach.image || defaultImage}
                      alt={beach.name}
                      className="nav-suggestion-img"
                      onError={(e) => { e.target.src = defaultImage; }}
                    />
                    <div className="nav-suggestion-info">
                      <div className="nav-suggestion-name">{beach.name}</div>
                      <div className="nav-suggestion-location">
                        <FaMapMarkerAlt className="me-1" />
                        {beach.location}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="nav-suggestions-footer" onClick={handleSubmit}>
                  <FaSearch className="me-2" />
                  Search for "{searchQuery}"
                </div>
              </div>
            )}

            {showSuggestions && searchQuery.trim() && suggestions.length === 0 && !loading && (
              <div className="nav-suggestions-dropdown">
                <div className="nav-suggestion-empty">
                  No beaches found for "{searchQuery}"
                </div>
              </div>
            )}
          </Form>
          
          <Nav className="ms-auto align-items-center gap-1">
            <Nav.Link 
              as={NavLink} 
              to="/" 
              className={`nav-item-custom ${location.pathname === '/' ? 'active' : ''}`}
            >
              <FaHome className="me-1" />
              Home
            </Nav.Link>
            
            <Nav.Link 
              as={NavLink} 
              to="/beaches"
              className={`nav-item-custom ${location.pathname === '/beaches' ? 'active' : ''}`}
            >
              <FaUmbrellaBeach className="me-1" />
              Beaches
            </Nav.Link>
            
            <Nav.Link 
              as={NavLink} 
              to="/compare"
              className={`nav-item-custom position-relative ${location.pathname === '/compare' ? 'active' : ''}`}
            >
              <FaBalanceScale className="me-1" />
              Compare
              {compareCount > 0 && (
                <Badge 
                  bg="danger" 
                  className="nav-badge"
                >
                  {compareCount}
                </Badge>
              )}
            </Nav.Link>
            
            <Nav.Link 
              as={NavLink} 
              to="/bookmarks"
              className={`nav-item-custom position-relative ${location.pathname === '/bookmarks' ? 'active' : ''}`}
            >
              <FaBookmark className="me-1" />
              Bookmarks
              {bookmarkCount > 0 && (
                <Badge 
                  bg="danger" 
                  className="nav-badge"
                >
                  {bookmarkCount}
                </Badge>
              )}
            </Nav.Link>
            
            <Nav.Link 
              as={NavLink} 
              to="/reviews"
              className={`nav-item-custom ${location.pathname === '/reviews' ? 'active' : ''}`}
            >
              <FaStar className="me-1" />
              Reviews
            </Nav.Link>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
