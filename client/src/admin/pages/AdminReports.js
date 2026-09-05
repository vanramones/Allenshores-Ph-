import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Form, Button, Table, Badge, Tabs, Tab } from 'react-bootstrap';
import { 
  FaFileAlt, FaCalendarAlt, FaUmbrellaBeach, 
  FaUsers, FaStar, FaChartBar, FaFilePdf, FaFileExcel,
  FaCheckCircle, FaClock, FaTimesCircle
} from 'react-icons/fa';
import { reportsAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState({
    from_date: '',
    to_date: ''
  });
  const [summary, setSummary] = useState(null);
  const [bookingsReport, setBookingsReport] = useState(null);
  const [beachesReport, setBeachesReport] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [reviewsReport, setReviewsReport] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const printRef = useRef();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [summaryRes, beachesRes, monthlyRes] = await Promise.all([
        reportsAPI.getSummary(dateRange),
        reportsAPI.getBeaches(dateRange),
        reportsAPI.getMonthly({ year: selectedYear })
      ]);
      setSummary(summaryRes.data);
      setBeachesReport(beachesRes.data);
      setMonthlyReport(monthlyRes.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredReports = async () => {
    try {
      setLoading(true);
      const [summaryRes, bookingsRes, beachesRes, reviewsRes] = await Promise.all([
        reportsAPI.getSummary(dateRange),
        reportsAPI.getBookings(dateRange),
        reportsAPI.getBeaches(dateRange),
        reportsAPI.getReviews(dateRange)
      ]);
      setSummary(summaryRes.data);
      setBookingsReport(bookingsRes.data);
      setBeachesReport(beachesRes.data);
      setReviewsReport(reviewsRes.data);
      toast.success('Reports generated successfully');
    } catch (error) {
      console.error('Error fetching filtered reports:', error);
      toast.error('Failed to generate reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    if (!dateRange.from_date || !dateRange.to_date) {
      toast.warning('Please select both start and end dates');
      return;
    }
    fetchFilteredReports();
  };

  const handleYearChange = async (year) => {
    setSelectedYear(year);
    try {
      const res = await reportsAPI.getMonthly({ year });
      setMonthlyReport(res.data);
    } catch (error) {
      toast.error('Failed to load monthly report');
    }
  };

  const exportToPDF = () => {
    const printContent = printRef.current;
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = `
      <html>
        <head>
          <title>AllenShores Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0077b6; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #0077b6; color: white; }
            .stat-card { display: inline-block; padding: 15px; margin: 10px; border: 1px solid #ddd; border-radius: 8px; min-width: 150px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #0077b6; }
            .stat-label { color: #666; font-size: 12px; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>AllenShores PH - Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          ${dateRange.from_date && dateRange.to_date ? `<p>Date Range: ${dateRange.from_date} to ${dateRange.to_date}</p>` : ''}
          ${printContent.innerHTML}
        </body>
      </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const exportToExcel = (data, filename, sheetName = 'Report') => {
    if (!data || data.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0]).map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLen + 2, maxWidth) };
    });
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file exported successfully');
  };

  const exportAllToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    if (summary) {
      const summaryData = [{
        'Total Beaches': summary.totalBeaches,
        'Total Bookings': summary.totalBookings,
        'Confirmed Bookings': summary.confirmedBookings,
        'Pending Bookings': summary.pendingBookings,
        'Cancelled Bookings': summary.cancelledBookings,
        'Total Guests': summary.totalGuests,
        'Total Reviews': summary.totalReviews,
        'Average Rating': summary.avgRating
      }];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Beach Performance sheet
    if (beachesReport && beachesReport.length > 0) {
      const beachData = beachesReport.map(b => ({
        'Beach Name': b.name,
        'Location': b.location,
        'Price': b.price,
        'Avg Rating': b.avg_rating,
        'Reviews': b.review_count,
        'Bookings': b.booking_count,
        'Total Guests': b.total_guests
      }));
      const beachSheet = XLSX.utils.json_to_sheet(beachData);
      XLSX.utils.book_append_sheet(workbook, beachSheet, 'Beach Performance');
    }

    // Monthly Stats sheet
    if (monthlyReport && monthlyReport.data) {
      const monthlyData = monthlyReport.data.map(m => ({
        'Month': m.name,
        'Total Bookings': m.total_bookings,
        'Confirmed': m.confirmed,
        'Pending': m.pending,
        'Cancelled': m.cancelled,
        'Total Guests': m.total_guests
      }));
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Stats');
    }

    // Bookings sheet
    if (bookingsReport && bookingsReport.bookings && bookingsReport.bookings.length > 0) {
      const bookingData = bookingsReport.bookings.map(b => ({
        'Reference': b.booking_ref,
        'Customer': b.full_name,
        'Email': b.email,
        'Phone': b.phone,
        'Beach': b.beach_name,
        'Visit Date': formatDate(b.visit_date),
        'People': b.people,
        'Status': b.status
      }));
      const bookingSheet = XLSX.utils.json_to_sheet(bookingData);
      XLSX.utils.book_append_sheet(workbook, bookingSheet, 'Bookings');
    }

    // Reviews sheet
    if (reviewsReport && reviewsReport.reviews && reviewsReport.reviews.length > 0) {
      const reviewData = reviewsReport.reviews.map(r => ({
        'Author': r.author,
        'Beach': r.beach_name,
        'Rating': r.rating,
        'Comment': r.comment,
        'Date': formatDate(r.created_at)
      }));
      const reviewSheet = XLSX.utils.json_to_sheet(reviewData);
      XLSX.utils.book_append_sheet(workbook, reviewSheet, 'Reviews');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dateStr = dateRange.from_date && dateRange.to_date 
      ? `${dateRange.from_date}_to_${dateRange.to_date}` 
      : new Date().toISOString().split('T')[0];
    saveAs(blob, `AllenShores_Full_Report_${dateStr}.xlsx`);
    toast.success('Full Excel report exported successfully');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !summary) return <Loading text="Loading reports..." />;

  return (
    <div className="admin-reports fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <FaFileAlt className="me-2 text-primary" />
            Reports
          </h2>
          <p className="text-muted mb-0">Generate and export detailed reports</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant="outline-primary" onClick={exportToPDF}>
            <FaFilePdf className="me-1" /> PDF
          </Button>
          <Button 
            variant="success" 
            onClick={exportAllToExcel}
          >
            <FaFileExcel className="me-1" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} sm={6} md={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">
                  <FaCalendarAlt className="me-1" /> From Date
                </Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.from_date}
                  onChange={(e) => handleDateChange('from_date', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">
                  <FaCalendarAlt className="me-1" /> To Date
                </Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.to_date}
                  onChange={(e) => handleDateChange('to_date', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={12} md={3}>
              <Button 
                variant="primary" 
                className="w-100"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                <FaChartBar className="me-1" />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Report Content */}
      <div ref={printRef}>
        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
          {/* Summary Tab */}
          <Tab eventKey="summary" title="Summary">
            {summary && (
              <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaUmbrellaBeach size={24} className="text-primary mb-2" />
                      <h3 className="fw-bold text-primary">{summary.totalBeaches}</h3>
                      <small className="text-muted">Total Beaches</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaCalendarAlt size={24} className="text-success mb-2" />
                      <h3 className="fw-bold text-success">{summary.totalBookings}</h3>
                      <small className="text-muted">Total Bookings</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaUsers size={24} className="text-info mb-2" />
                      <h3 className="fw-bold text-info">{summary.totalGuests}</h3>
                      <small className="text-muted">Total Guests</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FaStar size={24} className="text-warning mb-2" />
                      <h3 className="fw-bold text-warning">{summary.avgRating}</h3>
                      <small className="text-muted">Avg Rating</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {summary && (
              <Card>
                <Card.Header className="bg-white">
                  <h5 className="mb-0 fw-bold">Booking Status Breakdown</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col xs={12} md={4}>
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        <FaCheckCircle size={32} className="text-success" />
                        <div>
                          <h4 className="fw-bold mb-0 text-success">{summary.confirmedBookings}</h4>
                          <small className="text-muted">Confirmed</small>
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        <FaClock size={32} className="text-warning" />
                        <div>
                          <h4 className="fw-bold mb-0 text-warning">{summary.pendingBookings}</h4>
                          <small className="text-muted">Pending</small>
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        <FaTimesCircle size={32} className="text-danger" />
                        <div>
                          <h4 className="fw-bold mb-0 text-danger">{summary.cancelledBookings}</h4>
                          <small className="text-muted">Cancelled</small>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Tab>

          {/* Beach Performance Tab */}
          <Tab eventKey="beaches" title="Beach Performance">
            <Card>
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Beach Performance Report</h5>
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => exportToExcel(
                    beachesReport.map(b => ({
                      'Beach Name': b.name,
                      'Location': b.location,
                      'Price': b.price,
                      'Avg Rating': b.avg_rating,
                      'Reviews': b.review_count,
                      'Bookings': b.booking_count,
                      'Total Guests': b.total_guests
                    })), 
                    'beach_performance', 
                    'Beach Performance'
                  )}
                >
                  <FaFileExcel className="me-1" /> Excel
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Beach</th>
                      <th>Location</th>
                      <th>Price</th>
                      <th>Rating</th>
                      <th>Reviews</th>
                      <th>Bookings</th>
                      <th>Guests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beachesReport.map(beach => (
                      <tr key={beach.id}>
                        <td><strong>{beach.name}</strong></td>
                        <td>{beach.location}</td>
                        <td>₱{beach.price}</td>
                        <td>
                          <Badge bg="warning" className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                            <FaStar /> {beach.avg_rating}
                          </Badge>
                        </td>
                        <td>{beach.review_count}</td>
                        <td>{beach.booking_count}</td>
                        <td>{beach.total_guests}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          {/* Monthly Tab */}
          <Tab eventKey="monthly" title="Monthly Stats">
            <Card>
              <Card.Header className="bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0 fw-bold">Monthly Booking Statistics</h5>
                <Form.Select 
                  style={{ width: 'auto' }}
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Card.Header>
              <Card.Body className="p-0">
                {monthlyReport && (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Total</th>
                        <th>Confirmed</th>
                        <th>Pending</th>
                        <th>Cancelled</th>
                        <th>Guests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.data.map(month => (
                        <tr key={month.month}>
                          <td><strong>{month.name}</strong></td>
                          <td>{month.total_bookings}</td>
                          <td className="text-success">{month.confirmed}</td>
                          <td className="text-warning">{month.pending}</td>
                          <td className="text-danger">{month.cancelled}</td>
                          <td>{month.total_guests}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>{monthlyReport.data.reduce((s, m) => s + m.total_bookings, 0)}</strong></td>
                        <td className="text-success"><strong>{monthlyReport.data.reduce((s, m) => s + m.confirmed, 0)}</strong></td>
                        <td className="text-warning"><strong>{monthlyReport.data.reduce((s, m) => s + m.pending, 0)}</strong></td>
                        <td className="text-danger"><strong>{monthlyReport.data.reduce((s, m) => s + m.cancelled, 0)}</strong></td>
                        <td><strong>{monthlyReport.data.reduce((s, m) => s + m.total_guests, 0)}</strong></td>
                      </tr>
                    </tfoot>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* Bookings Tab */}
          <Tab eventKey="bookings" title="Bookings">
            <Card>
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Bookings Report</h5>
                {bookingsReport && (
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => exportToExcel(
                      bookingsReport.bookings.map(b => ({
                        'Reference': b.booking_ref,
                        'Customer': b.full_name,
                        'Email': b.email,
                        'Phone': b.phone,
                        'Beach': b.beach_name,
                        'Visit Date': formatDate(b.visit_date),
                        'People': b.people,
                        'Status': b.status
                      })), 
                      'bookings_report', 
                      'Bookings'
                    )}
                  >
                    <FaFileExcel className="me-1" /> Excel
                  </Button>
                )}
              </Card.Header>
              <Card.Body className="p-0">
                {!bookingsReport ? (
                  <div className="text-center py-5">
                    <FaCalendarAlt size={48} className="text-muted mb-3" />
                    <p className="text-muted">Select a date range and generate report to view bookings</p>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Customer</th>
                        <th>Beach</th>
                        <th>Date</th>
                        <th>People</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsReport.bookings.map(booking => (
                        <tr key={booking.id}>
                          <td><code className="text-primary">{booking.booking_ref}</code></td>
                          <td>{booking.full_name}</td>
                          <td>{booking.beach_name}</td>
                          <td>{formatDate(booking.visit_date)}</td>
                          <td>{booking.people}</td>
                          <td>
                            <Badge bg={
                              booking.status === 'confirmed' ? 'success' :
                              booking.status === 'pending' ? 'warning' : 'danger'
                            }>
                              {booking.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* Reviews Tab */}
          <Tab eventKey="reviews" title="Reviews">
            <Card>
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Reviews Report</h5>
                {reviewsReport && (
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => exportToExcel(
                      reviewsReport.reviews.map(r => ({
                        'Author': r.author,
                        'Beach': r.beach_name,
                        'Rating': r.rating,
                        'Comment': r.comment,
                        'Date': formatDate(r.created_at)
                      })), 
                      'reviews_report', 
                      'Reviews'
                    )}
                  >
                    <FaFileExcel className="me-1" /> Excel
                  </Button>
                )}
              </Card.Header>
              <Card.Body>
                {!reviewsReport ? (
                  <div className="text-center py-5">
                    <FaStar size={48} className="text-muted mb-3" />
                    <p className="text-muted">Select a date range and generate report to view reviews</p>
                  </div>
                ) : (
                  <>
                    <Row className="g-3 mb-4">
                      <Col xs={6} md={3}>
                        <div className="text-center p-3 bg-light rounded">
                          <h4 className="fw-bold text-primary">{reviewsReport.stats.total}</h4>
                          <small className="text-muted">Total Reviews</small>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-center p-3 bg-light rounded">
                          <h4 className="fw-bold text-warning">{reviewsReport.stats.avgRating}</h4>
                          <small className="text-muted">Avg Rating</small>
                        </div>
                      </Col>
                      {reviewsReport.stats.ratingDistribution.slice(0, 2).map(r => (
                        <Col xs={6} md={3} key={r.rating}>
                          <div className="text-center p-3 bg-light rounded">
                            <h4 className="fw-bold">{r.count}</h4>
                            <small className="text-muted">{r.rating} Star Reviews</small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                    <Table responsive hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Author</th>
                          <th>Beach</th>
                          <th>Rating</th>
                          <th>Comment</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewsReport.reviews.slice(0, 20).map(review => (
                          <tr key={review.id}>
                            <td>{review.author}</td>
                            <td>{review.beach_name}</td>
                            <td>
                              <Badge bg="warning">
                                <FaStar className="me-1" />{review.rating}
                              </Badge>
                            </td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {review.comment}
                            </td>
                            <td>{formatDate(review.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminReports;
