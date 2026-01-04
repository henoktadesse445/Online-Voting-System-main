import { useEffect, React, useRef } from 'react';
import ScrollReveal from "scrollreveal";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  useTheme
} from '@mui/material';
import { tokens } from '../../NewDashboard/theme';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

// import "../CSS/upcomingElections.css" // Removing custom CSS

const UpcomingElections = ({ voteStatus }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const revealRefBottom = useRef(null);
  const revealRefLeft = useRef(null);
  const revealRefTop = useRef(null);

  useEffect(() => {
    const sr = ScrollReveal({
      duration: 800,
      delay: 100,
      distance: '30px',
      easing: 'ease',
      reset: false
    });

    if (revealRefBottom.current) sr.reveal(revealRefBottom.current, { origin: 'bottom' });
    if (revealRefLeft.current) sr.reveal(revealRefLeft.current, { origin: 'left' });
    if (revealRefTop.current) sr.reveal(revealRefTop.current, { origin: 'top' });
  }, []);

  return (
    <Box sx={{ mt: 4, mb: 4 }} className="upcomingElections">
      <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 3 }} ref={revealRefTop}>
        Upcoming Elections
      </Typography>

      <Grid container justifyContent="center" ref={revealRefLeft}>
        <Grid item xs={12} md={8} lg={6}>
          <Card elevation={3} sx={{
            borderRadius: 2,
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: theme.palette.mode === 'dark' ? '0 10px 20px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.1)'
            },
            borderLeft: `6px solid ${colors.blueAccent[500]}`,
            backgroundColor: theme.palette.background.paper
          }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: colors.blueAccent[500] }}>
                WCU Student President Election
              </Typography>

              <Typography variant="body1" paragraph sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                Vote to elect the Wachemo University Student President. Ensure you are registered and eligible to participate in this campus election.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<HowToVoteIcon />}
                onClick={() => navigate('/Vote')}
                disabled={voteStatus} // Optional: disable if already voted
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 50,
                  textTransform: 'none',
                  fontSize: '1.1rem'
                }}
              >
                {voteStatus ? "You Have Voted" : "Participate / Vote"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
export default UpcomingElections;