import './Vote.css';
import UserNavbar from '../../../Navbar/UserNavbar';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ScrollReveal from "scrollreveal";
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { BASE_URL } from '../../../../helper';
import Cookies from 'js-cookie';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 700,
    bgcolor: 'rgb(255, 255, 255)',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};


const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        // backgroundColor: theme.palette.common,
        color: theme.palette.common.white,
        fontSize: 16,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));
const columns = [
    { id: 'fullname', label: `Candidate Name`, width: 220, minWidth: 180, align: "left" },
    { id: 'position', label: 'Position (After Election)', width: 200, minWidth: 180, align: "left" },
    { id: 'party', label: 'Department', width: 160, minWidth: 140 },
    { id: 'bio', label: 'Candidate Bio', width: 300, minWidth: 240, align: "left" },
    { id: 'age', label: 'CGPA', width: 80, minWidth: 80, align: "center" },
    { id: 'photo', label: 'Photo', width: 84, minWidth: 70, align: "left" },
    { id: 'action', label: '', width: 140, minWidth: 120 },
];



export default function CustomizedTables() {
    const revealRefBottom = useRef(null);
    const revealRefLeft = useRef(null);
    const revealRefTop = useRef(null);
    const revealRefRight = useRef(null);

    useEffect(() => {


        ScrollReveal().reveal(revealRefBottom.current, {

            duration: 1000,
            delay: 300,
            distance: '50px',
            origin: 'bottom',
            easing: 'ease',
            reset: 'true',
        });
    }, []);
    useEffect(() => {


        ScrollReveal().reveal(revealRefRight.current, {

            duration: 1000,
            delay: 300,
            distance: '50px',
            origin: 'right',
            easing: 'ease',
            reset: 'true',
        });
    }, []); useEffect(() => {


        ScrollReveal().reveal(revealRefLeft.current, {

            duration: 1000,
            delay: 300,
            distance: '50px',
            origin: 'left',
            easing: 'ease',
            reset: 'true',
        });
    }, []); useEffect(() => {


        ScrollReveal().reveal(revealRefTop.current, {

            duration: 1000,
            delay: 300,
            distance: '50px',
            origin: 'top',
            easing: 'ease',
            reset: 'true',
        });
    }, []);
    const [candidate, setCandidate] = useState([]);
    const voterid = Cookies.get('myCookie')

    useEffect(() => {
        // Fetch all candidates (single pool - no position grouping)
        axios.get(`${BASE_URL}/getCandidate`)
            .then((response) => {
                // Sort candidates by votes (highest first) for display
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
            console.error('No voter ID found in cookie');
            setIsLoadingVoter(false);
            return;
        }
        
        axios.get(`${BASE_URL}/getVoterbyID/${voterid}`)
            .then((response) => {
                if (response.data.success) {
                    setVoter(response.data.voter);
                } else {
                    console.error('Failed to fetch voter:', response.data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            })
            .finally(() => {
                setIsLoadingVoter(false);
            });
    }, [voterid]);

    // Fetch voting settings and update countdown
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/api/votingSettings`);
                if (response.data.success) {
                    setVotingSettings(response.data.settings);
                }
            } catch (error) {
                console.error('Error fetching voting settings:', error);
            }
        };
        
        fetchSettings();
        // Refresh more frequently (every 5 seconds) to catch immediate changes
        const interval = setInterval(fetchSettings, 5000);
        
        return () => clearInterval(interval);
    }, []);

    // Update countdown timer
    useEffect(() => {
        if (!votingSettings) return;
        
        const updateCountdown = () => {
            const now = new Date();
            const endDate = new Date(votingSettings.endDate);
            const startDate = new Date(votingSettings.startDate);
            
            // Add a buffer (30 seconds) to account for timezone and processing delays
            // If we're within 30 seconds of start time, consider voting active
            const buffer = 30000; // 30 seconds in milliseconds
            
            if (now < (startDate.getTime() - buffer)) {
                setTimeRemaining({ type: 'untilStart', ms: startDate - now });
            } else if (now >= (startDate.getTime() - buffer) && now <= endDate && votingSettings.isActive) {
                setTimeRemaining({ type: 'remaining', ms: endDate - now });
            } else {
                setTimeRemaining({ type: 'ended', ms: 0 });
            }
        };
        
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000); // Update every second
        
        return () => clearInterval(interval);
    }, [votingSettings]);

    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return '0 days, 0 hours, 0 minutes';
        
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    
    // OTP verification states
    const [otpModalOpen, setOtpModalOpen] = React.useState(false);
    const [otpCode, setOtpCode] = React.useState('');
    const [otpLoading, setOtpLoading] = React.useState(false);
    const [otpRequested, setOtpRequested] = React.useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = React.useState(null);
    const [otpMessage, setOtpMessage] = React.useState('');





    // Request OTP when user clicks vote
    const handleVote = async (id) => {
        try {
            // Check if voter data is loaded
            if (isLoadingVoter) {
                alert('Please wait while we load your voter information...');
                return;
            }

            // Check if voter ID exists in cookie
            if (!voterid) {
                alert('Session not found. Please login first, then visit the User page before voting.');
                window.location.href = '/Login';
                return;
            }

            // Check if voter data is loaded from API
            if (!voter) {
                alert('Could not load your voter information. Please visit the User page first, then return here to vote.');
                window.location.href = '/User';
                return;
            }

            const voterObjectId = voter._id || voterid;
            const objectIdRegex = /^[a-fA-F0-9]{24}$/;

            // Validate IDs
            if (!voterObjectId || !objectIdRegex.test(String(voterObjectId))) {
                alert('Invalid voter session. Please logout and login again.');
                return;
            }

            if (!id || !objectIdRegex.test(String(id))) {
                alert('Invalid candidate selection. Please try again.');
                return;
            }

            // Check if already voted
            if (voter.voteStatus) {
                alert("You Have Already Voted");
                return;
            }

            // Store selected candidate and open OTP modal
            setSelectedCandidateId(id);
            setOtpCode('');
            setOtpRequested(false);
            setOtpMessage('');
            setOtpModalOpen(true);
            
            // Request OTP
            setOtpLoading(true);
            const otpResponse = await axios.post(`${BASE_URL}/api/requestOTP`, {
                voterId: voterObjectId,
            });

            if (otpResponse.data.success) {
                setOtpRequested(true);
                setOtpMessage('OTP has been sent to your email address. Please check your inbox (and spam folder). The OTP is valid for 10 minutes.');
            } else {
                setOtpMessage(otpResponse.data.message || 'Failed to send OTP. Please try again or contact administrator.');
            }
        } catch (error) {
            console.error('Error requesting OTP:', error);
            const message = error?.response?.data?.message || 'Failed to request OTP. Please try again.';
            setOtpMessage(message);
            setOtpRequested(false);
        } finally {
            setOtpLoading(false);
        }
    }

    // Verify OTP and submit vote
    const handleVerifyOTPAndVote = async () => {
        try {
            if (!otpCode || otpCode.length !== 6) {
                setOtpMessage('Please enter a valid 6-digit OTP.');
                return;
            }

            if (!selectedCandidateId || !voter) {
                setOtpMessage('Invalid session. Please try again.');
                return;
            }

            const voterObjectId = voter._id || voterid;
            
            setOtpLoading(true);
            setOtpMessage('');

            // Submit vote with OTP (no position - single vote per voter)
            const response = await axios.post(`${BASE_URL}/vote`, {
                candidateId: selectedCandidateId,
                voterId: voterObjectId,
                otpCode: otpCode,
            });

            if (response.data.success) {
                // Update local voter state
                setVoter({ ...voter, voteStatus: true });
                setOtpModalOpen(false);
                handleOpen();
            } else {
                setOtpMessage(response.data.message || 'Voting failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during vote:', error);
            const message = error?.response?.data?.message || 'Voting failed. Please try again.';
            setOtpMessage(message);
        } finally {
            setOtpLoading(false);
        }
    }
    



    // Add 30 second buffer to account for timezone/delay issues
    const now = new Date();
    const startDate = votingSettings ? new Date(votingSettings.startDate) : null;
    const endDate = votingSettings ? new Date(votingSettings.endDate) : null;
    const buffer = 30000; // 30 seconds buffer for safety
    
    const isVotingActive = votingSettings && votingSettings.isActive && 
                           startDate && endDate &&
                           now >= (startDate.getTime() - buffer) && 
                           now <= endDate;

    return (
        <div className='Vote-Page'>
            <UserNavbar />
            <div className='candidate'>
                <h2 ref={revealRefLeft}>
                    {votingSettings?.electionTitle || 'WCU Student President Election'}
                </h2>
                <div className='Heading1' ref={revealRefRight}>
                    <p><span>GIVE</span> Your Vote</p>
                </div>
                
                {/* Voting Status Banner */}
                {votingSettings && (
                    <div style={{
                        padding: '15px',
                        margin: '20px auto',
                        maxWidth: '800px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        backgroundColor: isVotingActive ? '#e8f5e9' : 
                                       (startDate && now < (startDate.getTime() - 30000)) ? '#e3f2fd' : '#fff3e0',
                        border: `2px solid ${isVotingActive ? '#4caf50' : 
                                       (startDate && now < (startDate.getTime() - 30000)) ? '#2196f3' : '#ff9800'}`,
                    }}>
                        {isVotingActive ? (
                            <>
                                <h3 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>
                                    Voting is ACTIVE
                                </h3>
                                {timeRemaining?.type === 'remaining' && (
                                    <p style={{ color: '#1b5e20', fontSize: '16px', margin: '5px 0' }}>
                                        Time Remaining: <strong>{formatTimeRemaining(timeRemaining.ms)}</strong>
                                    </p>
                                )}
                            </>
                        ) : (startDate && now < (startDate.getTime() - 30000)) ? (
                            <>
                                <h3 style={{ color: '#1565c0', margin: '0 0 10px 0' }}>
                                    Voting Has Not Started Yet
                                </h3>
                                <p style={{ color: '#0d47a1', margin: '5px 0' }}>
                                    Voting will begin on: <strong>{startDate.toLocaleString()}</strong>
                                </p>
                                {timeRemaining?.type === 'untilStart' && (
                                    <p style={{ color: '#0d47a1', fontSize: '16px', margin: '5px 0' }}>
                                        Starts in: <strong>{formatTimeRemaining(timeRemaining.ms)}</strong>
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 style={{ color: '#e65100', margin: '0 0 10px 0' }}>
                                    Voting Has Ended
                                </h3>
                                <p style={{ color: '#bf360c', margin: '5px 0' }}>
                                    Voting ended on: <strong>{new Date(votingSettings.endDate).toLocaleString()}</strong>
                                </p>
                            </>
                        )}
                        {!votingSettings.isActive && (
                            <p style={{ color: '#c62828', margin: '10px 0 0 0', fontWeight: 'bold' }}>
                                Voting is currently disabled by administrator.
                            </p>
                        )}
                    </div>
                )}
                {!voterid && (
                    <div style={{ 
                        padding: '20px', 
                        margin: '20px', 
                        backgroundColor: '#ffebee', 
                        border: '1px solid #f44336',
                        borderRadius: '5px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: '#c62828' }}>Session Not Found</h3>
                        <p>Please <a href="/Login" style={{ color: '#1976d2', textDecoration: 'underline' }}>login</a> first to vote.</p>
                    </div>
                )}
                {voterid && !voter && !isLoadingVoter && (
                    <div style={{ 
                        padding: '20px', 
                        margin: '20px', 
                        backgroundColor: '#fff3e0', 
                        border: '1px solid #ff9800',
                        borderRadius: '5px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: '#e65100' }}>Voter Information Not Loaded</h3>
                        <p>Please visit the <a href="/User" style={{ color: '#1976d2', textDecoration: 'underline' }}>User page</a> first to initialize your session, then return here to vote.</p>
                    </div>
                )}
                {isLoadingVoter && (
                    <div style={{ 
                        padding: '20px', 
                        margin: '20px', 
                        textAlign: 'center'
                    }}>
                        <p>Loading your voter information...</p>
                    </div>
                )}
                {/* OTP Verification Modal */}
                <Modal
                    className='VoteContent'
                    aria-labelledby="otp-modal-title"
                    aria-describedby="otp-modal-description"
                    open={otpModalOpen}
                    onClose={() => {
                        if (!otpLoading) {
                            setOtpModalOpen(false);
                            setOtpCode('');
                            setOtpMessage('');
                            setOtpRequested(false);
                        }
                    }}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{
                        backdrop: {
                            timeout: 500,
                        },
                    }}
                >
                    <Fade in={otpModalOpen} className='VoteGivenBox'>
                        <Box sx={style} className="MessageBox">
                            <h2>OTP Verification Required</h2>
                            <p style={{ marginBottom: '20px', color: '#666' }}>
                                A One-Time Password has been sent to your email address. Please enter it below to complete your vote.
                            </p>
                            
                            {otpMessage && (
                                <div style={{
                                    padding: '15px',
                                    marginBottom: '15px',
                                    borderRadius: '4px',
                                    backgroundColor: otpMessage.includes('sent') || otpMessage.includes('success') 
                                        ? '#e8f5e9' 
                                        : '#ffebee',
                                    color: otpMessage.includes('sent') || otpMessage.includes('success')
                                        ? '#2e7d32'
                                        : '#c62828',
                                    fontSize: '14px',
                                    lineHeight: '1.6'
                                }}>
                                    {otpMessage}
                                </div>
                            )}

                            {/* Help message for users who don't receive email */}
                            {otpRequested && (
                                <div style={{
                                    padding: '12px',
                                    marginBottom: '15px',
                                    borderRadius: '4px',
                                    backgroundColor: '#e3f2fd',
                                    border: '1px solid #2196F3',
                                    fontSize: '13px',
                                    color: '#1565c0'
                                }}>
                                    <strong>📧 Didn't receive the email?</strong>
                                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                        <li>Check your spam/junk folder</li>
                                        <li>Wait a few minutes (emails may be delayed)</li>
                                        <li>Contact administrator if issue persists</li>
                                    </ul>
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Enter OTP (6 digits):
                                </label>
                                <input
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtpCode(value);
                                        setOtpMessage('');
                                    }}
                                    placeholder="000000"
                                    maxLength={6}
                                    disabled={otpLoading || !otpRequested}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '24px',
                                        textAlign: 'center',
                                        letterSpacing: '8px',
                                        border: '2px solid #2196F3',
                                        borderRadius: '4px',
                                        outline: 'none',
                                    }}
                                />
                                {otpRequested && (
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                        OTP is valid for 10 minutes
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={handleVerifyOTPAndVote}
                                    disabled={otpLoading || !otpRequested || otpCode.length !== 6}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '16px',
                                        backgroundColor: (otpLoading || !otpRequested || otpCode.length !== 6) 
                                            ? '#ccc' 
                                            : '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: (otpLoading || !otpRequested || otpCode.length !== 6) 
                                            ? 'not-allowed' 
                                            : 'pointer',
                                    }}
                                >
                                    {otpLoading ? 'Processing...' : 'Verify & Vote'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (!otpLoading) {
                                            setOtpModalOpen(false);
                                            setOtpCode('');
                                            setOtpMessage('');
                                            setOtpRequested(false);
                                        }
                                    }}
                                    disabled={otpLoading}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '16px',
                                        backgroundColor: '#757575',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: otpLoading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </Box>
                    </Fade>
                </Modal>

                {/* Success Modal */}
                <Modal
                    className='VoteContent'
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    open={open}
                    onClose={handleClose}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{
                        backdrop: {
                            timeout: 500,
                        },
                    }}
                >
                    <Fade in={open} className='VoteGivenBox'>
                        <Box sx={style} className="MessageBox">
                            <h2>Congratulations! </h2>
                            <h5>You Have Successfully Voted</h5>
                            <button onClick={handleClose}><a href="/User">Ok</a></button>
                        </Box>
                    </Fade>
                </Modal>
                {/* Info Banner */}
                <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196F3' }}>
                    <p style={{ margin: 0, color: '#1565c0', fontSize: '14px', textAlign: 'center' }}>
                        <strong>Position Assignment:</strong> All candidates are running in a single pool. After the election ends, positions will be automatically assigned based on vote totals (highest votes = President, 2nd highest = Vice President, etc.).
                    </p>
                </div>

                {/* All Candidates Table */}
                {candidate.length > 0 ? (
                    <TableContainer component={Paper} ref={revealRefBottom}>
                        <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderBottom: '2px solid #2196F3' }}>
                            <h3 style={{ margin: 0, color: '#1976d2' }}>All Candidates</h3>
                            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Vote for one candidate. Positions will be assigned after election ends based on vote totals.</p>
                        </div>
                        <Table size="small" sx={{ minWidth: 200 }} aria-label="customized table">
                            <TableHead>
                                <TableRow className='TableRow'>
                                    {columns.map((column) => (
                                        <TableCell className='table_row_heading'
                                            key={column.id}
                                            align={column.align}
                                            style={{ width: column.width, minWidth: column.minWidth }}
                                        >
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {candidate.map((row) => (
                                    <StyledTableRow key={row._id || row.name}>
                                        {/* Name */}
                                        <StyledTableCell align='left'>
                                            {row.name}
                                        </StyledTableCell>
                                        {/* Position - shows assigned position if election ended, otherwise shows "TBD" */}
                                        <StyledTableCell align='left'>
                                            <strong style={{ color: row.position ? '#4caf50' : '#999' }}>
                                                {row.position || 'TBD (After Election)'}
                                            </strong>
                                        </StyledTableCell>
                                        {/* Department */}
                                        <StyledTableCell align='left'>{row.party || row.department}</StyledTableCell>
                                        {/* Bio */}
                                        <StyledTableCell align='left'>{row.bio}</StyledTableCell>
                                        {/* CGPA */}
                                        <StyledTableCell align="center">{row.cgpa !== undefined ? row.cgpa : row.age || '-'}</StyledTableCell>
                                        {/* Photo */}
                                        <StyledTableCell align='left'>
                                            {row.img ? (
                                                <span className='Name-Row image'>
                                                    <img
                                                        alt={row.name || "Candidate"}
                                                        src={`${BASE_URL}${row.img}`}
                                                    />
                                                </span>
                                            ) : (
                                                <span>No image</span>
                                            )}
                                        </StyledTableCell>
                                        {/* Action */}
                                        <StyledTableCell align="right" className="voteButton">
                                            <Button 
                                                variant="contained" 
                                                className="voteButton" 
                                                onClick={() => handleVote(row._id)}
                                                disabled={
                                                    !voter || 
                                                    isLoadingVoter || 
                                                    (voter && voter.voteStatus) ||
                                                    !isVotingActive
                                                }
                                            >
                                                {!isVotingActive 
                                                    ? 'Voting Closed' 
                                                    : voter && voter.voteStatus 
                                                        ? 'Already Voted' 
                                                        : 'Vote'
                                                }
                                            </Button>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff3cd', borderRadius: '8px', marginTop: '20px' }}>
                        <p style={{ fontSize: '18px', color: '#856404' }}>No candidates registered yet.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
