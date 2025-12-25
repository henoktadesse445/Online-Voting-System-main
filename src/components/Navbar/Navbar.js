import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import './CSS/Nav.css'
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper function to check if current path is active
  const isActive = (path) => location.pathname === path;

  // Handle smooth scroll to section
  const handleSectionClick = (e, sectionId) => {
    e.preventDefault();

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
    <Navbar expand="lg" className={`Nav sticky-top ${scrolled ? 'scrolled' : ''}`}>
      <Navbar.Brand className="Heading" href="/">
        Online Voting
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" className='Toggle' />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mx-auto">
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
        </Nav>

        <Nav className="align-items-center gap-2">
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
    </Navbar>
  );
}

export default Nav_bar;
