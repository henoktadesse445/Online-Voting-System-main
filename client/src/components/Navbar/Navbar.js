import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';

import Button from 'react-bootstrap/Button';
import './CSS/Nav.css'
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaMoon, FaSun, FaHome, FaInfoCircle, FaListUl, FaQuestionCircle, FaEnvelope } from 'react-icons/fa';

import { ColorModeContext } from '../NewDashboard/theme';
import { useContext } from 'react';
import { useTheme } from '@mui/material';

function Nav_bar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isDark = theme.palette.mode === 'dark';

  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      if (window.innerWidth > 991 && expanded) {
        setExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [expanded]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [expanded]);

  // Helper function to check if current path is active
  const isActive = (path) => location.pathname === path;

  // Handle smooth scroll to section
  const handleSectionClick = (e, sectionId) => {
    e.preventDefault();
    setExpanded(false); // Close sidebar on link click

    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80; // Account for sticky header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  return (
    <>
      <Navbar
        expand="lg"
        expanded={expanded}
        className={`Nav sticky-top ${scrolled ? 'scrolled' : ''} ${expanded ? 'sidebar-open' : ''}`}
      >
        <Container fluid className="d-flex align-items-center justify-content-between px-0">
          <Navbar.Brand className="Heading" href="/">
            Online Voting
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            className='Toggle'
            onClick={() => setExpanded(!expanded)}
          />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Close button for mobile sidebar */}
            <div className="sidebar-header d-lg-none">
              <span className="sidebar-title">Menu</span>
              <button className="btn-close btn-close-white" onClick={() => setExpanded(false)}></button>
            </div>

            <Nav className="mx-auto">
              <Nav.Link
                className={`Nav-items ${isActive('/') ? 'active' : ''}`}
                href="/"
                onClick={() => setExpanded(false)}
              >
                <FaHome className="nav-icon d-lg-none" /> Home
              </Nav.Link>

              <Nav.Link
                className="Nav-items"
                href="/#about"
                onClick={(e) => handleSectionClick(e, 'about')}
              >
                <FaInfoCircle className="nav-icon d-lg-none" /> About
              </Nav.Link>

              <Nav.Link
                className="Nav-items"
                href="/#features"
                onClick={(e) => handleSectionClick(e, 'features')}
              >
                <FaListUl className="nav-icon d-lg-none" /> Features
              </Nav.Link>

              <Nav.Link
                className="Nav-items"
                href="/#faq"
                onClick={(e) => handleSectionClick(e, 'faq')}
              >
                <FaQuestionCircle className="nav-icon d-lg-none" /> FAQ
              </Nav.Link>

              <Nav.Link
                className="Nav-items"
                href="/#contact"
                onClick={(e) => handleSectionClick(e, 'contact')}
              >
                <FaEnvelope className="nav-icon d-lg-none" /> Contact
              </Nav.Link>
            </Nav>

            <Nav className="align-items-center gap-2 menu-actions">
              <Button
                variant="link"
                onClick={colorMode.toggleColorMode}
                className="ThemeToggleButton text-decoration-none"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <FaSun size={18} /> : <FaMoon size={18} />}
              </Button>

              <Button
                href="/Login"
                className="LoginButton px-4 ms-lg-2"
                variant={isDark ? "outline-light" : "outline-primary"}
                style={{ borderRadius: '0.5rem', fontWeight: '600' }}
              >
                Login
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {/* Backdrop for mobile */}
      {expanded && <div className="navbar-backdrop" onClick={() => setExpanded(false)}></div>}
    </>
  );
}

export default Nav_bar;
