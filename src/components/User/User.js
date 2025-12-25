import { useState, useEffect, React, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import UserNavbar from "../Navbar/UserNavbar";
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  Alert,
  Divider
} from '@mui/material';
// import './CSS/user.css' // Removing custom CSS dependency
import UserCard from './Components/UserCard/userCard'
import UpcomingElections from './Components/UpcomingElections';
import ScrollReveal from "scrollreveal";
import { BASE_URL } from '../../helper';
import Cookies from 'js-cookie';

const User = () => {
  const location = useLocation();
  const { voterst } = location.state || {};

  // Set cookie if voter state is passed from login
  useEffect(() => {
    if (voterst && voterst.id) {
      // Set cookie for 7 days
      Cookies.set('myCookie', voterst.id, { expires: 7 });

    }
  }, [voterst]);

  const voterid = Cookies.get('myCookie');
  const revealRefBottom = useRef(null);
  const revealRefLeft = useRef(null);
  const revealRefTop = useRef(null);
  const revealRefRight = useRef(null);

  // Optimized: Single useEffect for all ScrollReveal animations
  useEffect(() => {
    // Initialize all ScrollReveal animations together for better performance
    const scrollRevealConfig = {
      duration: 600, // Reduced from 1000ms
      delay: 50, // Reduced from 200ms
      distance: '30px', // Reduced from 50px
      easing: 'ease',
      reset: false, // Changed from 'true' to false for better performance
    };

    if (revealRefBottom.current) {
      ScrollReveal().reveal(revealRefBottom.current, { ...scrollRevealConfig, origin: 'bottom' });
    }
    if (revealRefRight.current) {
      ScrollReveal().reveal(revealRefRight.current, { ...scrollRevealConfig, origin: 'right' });
    }
    if (revealRefLeft.current) {
      ScrollReveal().reveal(revealRefLeft.current, { ...scrollRevealConfig, origin: 'left' });
    }
    if (revealRefTop.current) {
      ScrollReveal().reveal(revealRefTop.current, { ...scrollRevealConfig, origin: 'top' });
    }
  }, []);
  const [singleVoter, setVoter] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If voter data is passed from login, use it immediately for faster display
    if (voterst && voterst.id && !voterid) {
      setIsLoading(false);
      return;
    }

    if (!voterid) {
      console.warn('No voter ID found in cookie');
      if (!voterst) {
        setError('Session not found. Please login again.');
      }
      setIsLoading(false);
      return;
    }

    axios.get(`${BASE_URL}/getVoterbyID/${voterid}`)
      .then((response) => {

        if (response.data.success) {
          setVoter(response.data.voter);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to load voter information');
        }
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setError('Failed to load voter information. Please try logging in again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [voterid, voterst]);

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <UserNavbar />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error} - <a href="/Login" style={{ color: 'inherit', textDecoration: 'underline' }}>Login</a>
          </Alert>
        )}

        <Box sx={{ textAlign: 'center', mb: 4 }} ref={revealRefTop}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#333' }}>
            Welcome <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{singleVoter.firstName || singleVoter.name}</span>
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column: User Profile */}
          <Grid item xs={12} md={4} ref={revealRefLeft}>
            <UserCard voter={singleVoter} />
          </Grid>

          {/* Right Column: Welcome Message */}
          <Grid item xs={12} md={8} ref={revealRefRight}>
            <Paper elevation={3} sx={{ p: 4, height: '100%', borderRadius: 2, backgroundColor: '#ffffff' }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#333' }}>
                Welcome to <span style={{ color: '#1976d2', fontWeight: 'bold' }}>Online Voting Platform</span>
              </Typography>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#555', fontStyle: 'italic', mb: 3 }}>
                Exercise Your Right to Vote Anytime, Anywhere
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, color: '#444', textAlign: 'justify' }}>
                Welcome to our online voting platform, where your voice matters. With the convenience of modern technology,
                we bring democracy to your fingertips, enabling you to participate in important decisions and elections
                from the comfort of your own home.
              </Typography>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, color: '#444', textAlign: 'justify' }}>
                Our secure and user-friendly platform ensures that your vote is counted accurately and confidentially.
                Whether it's electing your local representatives, deciding on community initiatives, or participating
                in organizational polls, our platform empowers you to make a difference.
              </Typography>
            </Paper>
          </Grid>

          {/* Bottom Row: Upcoming Elections */}
          <Grid item xs={12} ref={revealRefBottom}>
            <UpcomingElections voteStatus={singleVoter.voteStatus} />
          </Grid>
        </Grid>
      </Container>
    </div>
  )
}
export default User;