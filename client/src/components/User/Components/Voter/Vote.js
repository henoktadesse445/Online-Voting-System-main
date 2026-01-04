import './Vote.css';
import UserNavbar from '../../../Navbar/UserNavbar';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import api from '../../../../api';
import ScrollReveal from "scrollreveal";
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import {
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Typography,
    Grid,
    Chip,
    Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../../../helper';
import Cookies from 'js-cookie';


export default function CustomizedTables() {
    const navigate = useNavigate();
    const revealRefBottom = useRef(null);
    const revealRefLeft = useRef(null);
    const revealRefTop = useRef(null);
    const revealRefRight = useRef(null);

    useEffect(() => {
        if (revealRefBottom.current) {
            ScrollReveal().reveal(revealRefBottom.current, {
                duration: 1000,
                delay: 300,
                distance: '50px',
                origin: 'bottom',
                easing: 'ease',
                reset: 'true',
            });
        }
    }, []);

    useEffect(() => {
        if (revealRefRight.current) {
            ScrollReveal().reveal(revealRefRight.current, {
                duration: 1000,
                delay: 300,
                distance: '50px',
                origin: 'right',
                easing: 'ease',
                reset: 'true',
            });
        }
    }, []);

    useEffect(() => {
        if (revealRefLeft.current) {
            ScrollReveal().reveal(revealRefLeft.current, {
                duration: 1000,
                delay: 300,
                distance: '50px',
                origin: 'left',
                easing: 'ease',
                reset: 'true',
            });
        }
    }, []);

    useEffect(() => {
        if (revealRefTop.current) {
            ScrollReveal().reveal(revealRefTop.current, {
                duration: 1000,
                delay: 300,
                distance: '50px',
                origin: 'top',
                easing: 'ease',
                reset: 'true',
            });
        }
    }, []);
    const [candidate, setCandidate] = useState([]);
    const voterid = Cookies.get('myCookie')

    useEffect(() => {
        // Fetch all candidates
        api.get(`/api/candidates/all`)
            .then((response) => {
                const sorted = response.data.candidate.sort((a, b) => (b.votes || 0) - (a.votes || 0));
                setCandidate(sorted);
            })
            .catch(err => console.error("Error fetching data: ", err));
    }, [])

    const [voter, setVoter] = useState(null);
    const [isLoadingVoter, setIsLoadingVoter] = useState(true);
    const [votingSettings, setVotingSettings] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);

    useEffect(() => {
        if (!voterid) {
            setIsLoadingVoter(false);
            return;
        }

        api.get(`/api/voters/${voterid}`)
            .then((response) => {
                if (response.data.success) {
                    setVoter(response.data.voter);
                }
            })
            .catch(error => console.error('Error fetching user data:', error))
            .finally(() => setIsLoadingVoter(false));
    }, [voterid]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get(`/api/voting/settings`);
                if (response.data.success) {
                    setVotingSettings(response.data.settings);
                }
            } catch (error) {
                console.error('Error fetching voting settings:', error);
            }
        };

        fetchSettings();
        const interval = setInterval(fetchSettings, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!votingSettings) return;

        const updateCountdown = () => {
            const now = new Date();
            const endDate = new Date(votingSettings.endDate);
            const startDate = new Date(votingSettings.startDate);
            const buffer = 30000;

            if (now < (startDate.getTime() - buffer)) {
                setTimeRemaining({ type: 'untilStart', ms: startDate - now });
            } else if (now >= (startDate.getTime() - buffer) && now <= endDate && votingSettings.isActive) {
                setTimeRemaining({ type: 'remaining', ms: endDate - now });
            } else {
                setTimeRemaining({ type: 'ended', ms: 0 });
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [votingSettings]);

    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return '0d 0h 0m 0s';
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const [open, setOpen] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [otpMessage, setOtpMessage] = useState('');

    const handleVote = async (id) => {
        if (isLoadingVoter) return;
        if (!voterid || !voter) {
            alert('Please login and visit your account page first.');
            return;
        }
        if (voter.voteStatus) {
            alert("You Have Already Voted");
            return;
        }

        setSelectedCandidateId(id);
        setOtpCode('');
        setOtpRequested(false);
        setOtpMessage('');
        setOtpModalOpen(true);

        setOtpLoading(true);
        try {
            const otpResponse = await api.post(`/api/voting/request-otp`, { voterId: voter._id || voterid });
            if (otpResponse.data.success) {
                setOtpRequested(true);
                setOtpMessage('OTP sent to your email. Valid for 10 minutes.');
            } else {
                setOtpMessage(otpResponse.data.message || 'Failed to send OTP.');
            }
        } catch (error) {
            setOtpMessage(error?.response?.data?.message || 'Failed to request OTP.');
        } finally {
            setOtpLoading(false);
        }
    }

    const handleVerifyOTPAndVote = async () => {
        if (!otpCode || otpCode.length !== 6) return;
        setOtpLoading(true);
        try {
            const response = await api.post(`/api/voting/vote`, {
                candidateId: selectedCandidateId,
                voterId: voter._id || voterid,
                otpCode: otpCode,
            });

            if (response.data.success) {
                setVoter({ ...voter, voteStatus: true });
                setOtpModalOpen(false);
                setOpen(true);
            } else {
                setOtpMessage(response.data.message || 'Voting failed.');
            }
        } catch (error) {
            setOtpMessage(error?.response?.data?.message || 'Voting failed.');
        } finally {
            setOtpLoading(false);
        }
    }

    const now = new Date();
    const startDate = votingSettings ? new Date(votingSettings.startDate) : null;
    const endDate = votingSettings ? new Date(votingSettings.endDate) : null;
    const buffer = 30000;
    const isVotingActive = votingSettings && votingSettings.isActive && startDate && endDate && now >= (startDate.getTime() - buffer) && now <= endDate;

    return (
        <div className='Vote-Page'>
            <UserNavbar />

            <div className='vote-container'>
                <div className='vote-header'>
                    <h2 ref={revealRefLeft}>{votingSettings?.electionTitle || 'WCU Student Federation Election'}</h2>
                    <div className='vote-subtitle' ref={revealRefRight}>
                        <p><span>GIVE</span> Your Vote</p>
                    </div>
                </div>

                {/* Voting Status Banner */}
                {votingSettings && (
                    <div className={`status-banner ${isVotingActive ? 'active' : (startDate && now < (startDate.getTime() - buffer)) ? 'pending' : 'ended'}`}>
                        {isVotingActive ? (
                            <>
                                <h3>VOTING IS ACTIVE</h3>
                                {timeRemaining?.type === 'remaining' && (
                                    <p>Time Remaining: <strong>{formatTimeRemaining(timeRemaining.ms)}</strong></p>
                                )}
                            </>
                        ) : (startDate && now < (startDate.getTime() - buffer)) ? (
                            <>
                                <h3>UPCOMING ELECTION</h3>
                                <p>Voting begins: <strong>{startDate.toLocaleString()}</strong></p>
                                {timeRemaining?.type === 'untilStart' && (
                                    <p>Starts in: <strong>{formatTimeRemaining(timeRemaining.ms)}</strong></p>
                                )}
                            </>
                        ) : (
                            <>
                                <h3>VOTING HAS ENDED</h3>
                                <p>Election concluded on: <strong>{endDate?.toLocaleString()}</strong></p>
                            </>
                        )}
                        {!votingSettings.isActive && <p className="admin-disabled">Voting is currently disabled by administrator.</p>}
                    </div>
                )}

                {!voterid && (
                    <div className="status-banner error">
                        <h3>Session Not Found</h3>
                        <p>Please <a href="/Login" className="text-link">login</a> first to participate in the election.</p>
                    </div>
                )}

                {voterid && !voter && !isLoadingVoter && (
                    <div className="status-banner error">
                        <h3>Voter ID Required</h3>
                        <p>Visit <a href="/User" className="text-link">My Account</a> to initialize your voting session.</p>
                    </div>
                )}

                {/* OTP Verification Modal */}
                <Modal
                    open={otpModalOpen}
                    onClose={() => !otpLoading && setOtpModalOpen(false)}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{ backdrop: { timeout: 500 } }}
                >
                    <Fade in={otpModalOpen}>
                        <Box className="vote-modal-box">
                            <h2>Security Verification</h2>
                            <p>Verify your identity by entering the code sent to your email.</p>

                            {otpMessage && (
                                <div className={`otp-message ${otpMessage.includes('sent') ? 'success' : 'error'}`}>
                                    {otpMessage}
                                </div>
                            )}

                            {otpRequested && (
                                <div className="otp-help">
                                    <strong>📧 Checking for OTP?</strong>
                                    <ul>
                                        <li>Verify your spam/junk folder.</li>
                                        <li>Ensure you are checking the email associated with your ID.</li>
                                    </ul>
                                </div>
                            )}

                            <div className="otp-input-container">
                                <label className="otp-label">Enter 6-Digit Code</label>
                                <input
                                    className="otp-field"
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    disabled={otpLoading || !otpRequested}
                                />
                                {otpRequested && <p className="otp-validity">Code valid for 10 minutes</p>}
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn-standard btn-primary"
                                    onClick={handleVerifyOTPAndVote}
                                    disabled={otpLoading || !otpRequested || otpCode.length !== 6}
                                >
                                    {otpLoading ? 'Processing...' : 'Verify & Cast Vote'}
                                </button>
                                <button
                                    className="btn-standard btn-secondary-custom"
                                    onClick={() => setOtpModalOpen(false)}
                                    disabled={otpLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </Box>
                    </Fade>
                </Modal>

                {/* Success Modal */}
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{ backdrop: { timeout: 500 } }}
                >
                    <Fade in={open}>
                        <Box className="vote-modal-box">
                            <h2 className="modal-title-success">Success! 🗳️</h2>
                            <h5>Your vote has been cast successfully.</h5>
                            <button className="btn-standard btn-primary" onClick={() => navigate('/User')}>Return to Dashboard</button>
                        </Box>
                    </Fade>
                </Modal>

                <div className="info-banner">
                    <p><strong>Position Assignment:</strong> Each candidate runs for a specific position. Your vote supports their candidacy for that role.</p>
                </div>

                <div className="section-header-card" ref={revealRefBottom}>
                    <h3>Candidate Profiles</h3>
                    <p>Review the registered candidates below and cast your vote.</p>
                </div>

                {candidate.length > 0 ? (
                    <Grid container spacing={4}>
                        {candidate.map((row) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={row._id}>
                                <Card className="candidate-card-container">
                                    <Box className="candidate-image-box">
                                        <CardMedia
                                            component="img"
                                            image={row.img ? `${BASE_URL}${row.img}` : "https://via.placeholder.com/280?text=No+Photo"}
                                            alt={row.name}
                                            className="candidate-image"
                                        />
                                        {row.position && (
                                            <Chip
                                                label={row.position}
                                                size="small"
                                                className="candidate-position-tag"
                                            />
                                        )}
                                    </Box>

                                    <CardContent className="candidate-card-content">
                                        <Typography variant="h5" className="candidate-name">
                                            {row.name}
                                        </Typography>

                                        <Box className="candidate-info-row">
                                            <SchoolIcon className="candidate-info-icon" />
                                            <Typography variant="body2" className="candidate-department">
                                                {row.party || row.department}
                                            </Typography>
                                        </Box>

                                        <Box className="candidate-stats-row">
                                            <Chip
                                                icon={<PersonIcon className="candidate-info-icon" />}
                                                label={`CGPA: ${row.cgpa !== undefined ? row.cgpa : (row.age || 'N/A')}`}
                                                size="small"
                                                className="candidate-stat-chip"
                                            />
                                        </Box>

                                        <Typography variant="body2" className="candidate-bio">
                                            {row.bio ? `"${row.bio}"` : "No bio provided."}
                                        </Typography>
                                    </CardContent>

                                    <CardActions className="candidate-actions">
                                        <Button
                                            className="btn-standard btn-primary vote-button-full"
                                            onClick={() => handleVote(row._id)}
                                            disabled={!voter || isLoadingVoter || (voter && voter.voteStatus) || !isVotingActive}
                                        >
                                            {!isVotingActive ? 'Voting Closed' : voter && voter.voteStatus ? 'Already Voted' : 'CAST VOTE'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <div className="status-banner pending">
                        <h3>No Candidates Found</h3>
                        <p>Information will be available once candidates are registered and approved.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
