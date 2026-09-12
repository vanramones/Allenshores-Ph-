import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { FaTrash, FaPlus, FaStar, FaMapMarkerAlt, FaHome, FaBed, FaCheckCircle, FaTimesCircle, FaTag, FaMoneyBillWave, FaUtensils, FaBuilding } from 'react-icons/fa';
import { useCompare } from '../../context/CompareContext';
import StarRating from '../../components/common/StarRating';

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  const defaultImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80';

  // Professional comparison sections - no emojis, clean labels
  const comparisonSections = [
    {
      title: 'Location & Type',
      fields: [
        { key: 'location', label: 'Location', icon: <FaMapMarkerAlt /> },
        { key: 'type', label: 'Beach Type', default: 'Beach', icon: <FaHome /> },
      ]
    },
    {
      title: 'Pricing',
      fields: [
        {
          key: 'price',
          label: 'Entrance Fee',
          icon: <FaTag />,
          render: (val) => `₱${val || 0} / person`
        },
        { key: 'price_level', label: 'Price Level', default: 'Budget', icon: <FaMoneyBillWave /> },
      ]
    },
    {
      title: 'Cottages & Rooms',
      fields: [
        {
          key: 'cottage_available',
          label: 'Cottage Options',
          icon: <FaHome />,
          render: (val, beach) => val ? (
            <span className="text-success">
              <FaCheckCircle className="me-1" />
              {beach.cottage_count || 0} available · ₱{beach.cottage_price || '0'}
            </span>
          ) : (
            <span className="text-muted">
              <FaTimesCircle className="me-1" /> Not available
            </span>
          )
        },
        {
          key: 'room_available',
          label: 'Room Options',
          icon: <FaBed />,
          render: (val, beach) => val ? (
            <span className="text-success">
              <FaCheckCircle className="me-1" />
              {beach.room_count || 0} available · ₱{beach.room_price || '0'} / night
            </span>
          ) : (
            <span className="text-muted">
              <FaTimesCircle className="me-1" /> Not available
            </span>
          )
        },
      ]
    },
    {
      title: 'Ratings & Reviews',
      fields: [
        {
          key: 'rating',
          label: 'User Rating',
          icon: <FaStar />,
          render: (val) => (
            <span className="d-inline-flex align-items-center gap-2">
              <StarRating rating={parseFloat(val) || 0} size="sm" />
              <span className="fw-bold">{parseFloat(val || 0).toFixed(1)} / 5</span>
            </span>
          )
        },
        {
          key: 'reviews_count',
          label: 'Total Reviews',
          icon: <FaStar />,
          render: (val) => `${val || 0} reviews`
        },
      ]
    }
  ];

  if (compareList.length === 0) {
    return (
      <div className="fade-in py-5">
        <Container className="text-center">
          <div className="mb-3" style={{ fontSize: '3rem', color: '#cbd5e1' }}>
            <FaPlus size={48} />
          </div>
          <h2 className="fw-bold mb-3">No Beaches to Compare</h2>
          <p className="text-muted mb-4">
            Add beaches to your compare list to see them side by side
          </p>
          <Link to="/beaches" className="btn btn-primary btn-lg">
            <FaPlus className="me-2" />
            Browse Beaches
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="user-compare fade-in py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-1">Compare Beaches</h1>
            <p className="text-muted mb-0">
              Comparing {compareList.length} beach{compareList.length > 1 ? 'es' : ''}
            </p>
          </div>
          <div className="d-flex gap-2">
            {compareList.length < 3 && (
              <Link to="/beaches" className="btn btn-outline-primary">
                <FaPlus className="me-1" /> Add More
              </Link>
            )}
            <Button variant="outline-danger" onClick={clearCompare}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Beach Cards */}
        <Row className="g-4 mb-4">
          {compareList.map(beach => (
            <Col xs={12} sm={6} md={4} key={beach.id}>
              <Card className="compare-card h-100">
                <div className="position-relative">
                  <Card.Img
                    variant="top"
                    src={beach.image || defaultImage}
                    alt={beach.name}
                    style={{ height: '180px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = defaultImage; }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2 rounded-circle"
                    onClick={() => removeFromCompare(beach.id)}
                    title="Remove from compare"
                  >
                    <FaTrash />
                  </Button>
                </div>
                <Card.Body className="text-center">
                  <h5 className="fw-bold mb-1">{beach.name}</h5>
                  <p className="text-muted small mb-2">
                    <FaMapMarkerAlt className="me-1" />
                    {beach.location}
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <Badge bg="warning" className="d-flex align-items-center gap-1">
                      <FaStar /> {parseFloat(beach.rating || 0).toFixed(1)}
                    </Badge>
                    <Badge bg="primary">₱{beach.price || 0}</Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: 3 - compareList.length }).map((_, i) => (
            <Col xs={12} sm={6} md={4} key={`empty-${i}`}>
              <Card className="compare-card h-100 border-dashed" style={{ borderStyle: 'dashed', opacity: 0.5 }}>
                <Card.Body className="d-flex flex-column align-items-center justify-content-center py-5">
                  <FaPlus size={32} className="text-muted mb-2" />
                  <p className="text-muted mb-0">Add a beach</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Comparison Table */}
        <Card>
          <Card.Header className="bg-white">
            <h5 className="mb-0 fw-bold">Detailed Comparison</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive className="mb-0 compare-table">
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>Feature</th>
                  {compareList.map(beach => (
                    <th key={beach.id} className="text-center">{beach.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section, sIdx) => (
                  <React.Fragment key={section.title}>
                    {/* Section Header Row */}
                    <tr className="compare-section-header">
                      <td colSpan={compareList.length + 1}>
                        <span className="text-uppercase">{section.title}</span>
                      </td>
                    </tr>
                    {/* Section Fields */}
                    {section.fields.map(field => (
                      <tr key={field.key}>
                        <td className="fw-semibold text-muted">
                          {field.icon && <span className="me-2 text-secondary" style={{ fontSize: '0.85em' }}>{field.icon}</span>}
                          {field.label}
                        </td>
                        {compareList.map(beach => (
                          <td key={beach.id} className="text-center" data-label={beach.name}>
                            {field.render
                              ? field.render(beach[field.key], beach)
                              : beach[field.key] || field.default || '-'
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div className="text-center mt-4">
          <p className="text-muted mb-3">Ready to book?</p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            {compareList.map(beach => (
              <Link 
                key={beach.id} 
                to={`/booking?beach=${beach.id}`} 
                className="btn btn-primary"
              >
                Book {beach.name}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Compare;
