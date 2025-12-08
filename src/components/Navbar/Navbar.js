import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import './CSS/Nav.css'
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

function Nav_bar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored !== 'light' : true;
  });

  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Helper function to check if current path is active
  const isActive = (path) => location.pathname === path;

  // Handle smooth scroll to section
  const handleSectionClick = (e, sectionId) => {
    e.preventDefault();

    // If we're already on the home page
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home page first, then scroll
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <Navbar expand="lg" className="Nav sticky-top">
      <Navbar.Brand className="Heading" href="/">
        Online Voting System
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" className='Toggle' />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto Nav">
          <Nav.Link
            className={`Nav-items ${isActive('/') ? 'active' : ''}`}
            href="/"
          >
            Home
          </Nav.Link>

          <Nav.Link
            className="Nav-items"
            href="/#about"
            onClick={(e) => handleSectionClick(e, 'about')}
          >
            About
          </Nav.Link>

          <Nav.Link
            className="Nav-items"
            href="/#features"
            onClick={(e) => handleSectionClick(e, 'features')}
          >
            Features
          </Nav.Link>

          <Nav.Link
            className="Nav-items"
            href="/#faq"
            onClick={(e) => handleSectionClick(e, 'faq')}
          >
            FAQ
          </Nav.Link>

          <Nav.Link
            className="Nav-items"
            href="/#contact"
            onClick={(e) => handleSectionClick(e, 'contact')}
          >
            Contact
          </Nav.Link>

          <NavDropdown
            title="Get Started"
            id="getstarted-dropdown"
            className="Nav-items"
          >
            {/* Voter Registration removed - User registration disabled */}
            <NavDropdown.Item href="/Login">
              Voter Login
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>

        <Nav>
          <Button
            variant={isDark ? 'outline-light' : 'outline-dark'}
            onClick={toggleTheme}
            size="sm"
            className="ThemeToggleButton"
            style={{
              marginRight: '8px',
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              color: isDark ? '#fff' : '#222',
              fontWeight: '600',
              fontSize: '1rem',
              padding: '0.4rem 0.6rem'
            }}
          >
            {isDark ? <FaMoon /> : <FaSun />}
          </Button>
          {/* Register button removed - User registration disabled */}
          <Button
            variant={isDark ? 'outline-light' : 'outline-dark'}
            href="/Login"
            size="sm"
            style={{
              marginRight: '8px',
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              color: isDark ? '#fff' : '#222',
              fontSize: '0.85rem',
              padding: '0.4rem 0.8rem'
            }}
          >
            Login
          </Button>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default Nav_bar;
