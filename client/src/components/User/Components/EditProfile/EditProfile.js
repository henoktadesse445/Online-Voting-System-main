
import { useState, useEffect } from 'react';
import UserNavbar from "../../../Navbar/UserNavbar";
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// MUI Components
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Divider,
    Alert,
    Grid,
    useTheme,
    CircularProgress,
    Stack,
    InputAdornment
} from '@mui/material';

// MUI Icons
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SaveIcon from '@mui/icons-material/Save';

import { tokens } from '../../../NewDashboard/theme';

const EditProfile = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        voterId: '',
        studentId: '',
        pass: '',
        re_pass: '',
        party: '',
        bio: '',
        cgpa: ''
    });
    const [userRole, setUserRole] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const voterId = Cookies.get('myCookie');
        if (!voterId) {
            toast.error('Session expired. Please login again.');
            setTimeout(() => navigate('/Login'), 2000);
            return;
        }

        axios.get(`${BASE_URL}/getVoterbyID/${voterId}`)
            .then((response) => {
                if (response.data.success && response.data.voter) {
                    const voter = response.data.voter;
                    setUserRole(voter.role || 'voter');
                    setUserData(voter);
                    setFormData({
                        name: voter.name || '',
                        email: voter.email || '',
                        voterId: voter.voterId || '',
                        studentId: voter.voterId || '',
                        pass: '',
                        re_pass: '',
                        party: voter.party || voter.department || '',
                        bio: voter.bio || '',
                        cgpa: voter.cgpa || voter.age || ''
                    });
                } else {
                    toast.error('Failed to load profile data');
                }
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                toast.error('Failed to load profile data. Please try again.');
            })
            .finally(() => {
                setLoadingData(false);
            });
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const validateStudentId = (studentId) => {
        const wcuPattern = /^WCU\d{7}$/;
        return wcuPattern.test(studentId);
    };

    const validateEmail = (email) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (userRole === null) {
            toast.error('Please wait while we load your profile information...');
            setLoading(false);
            return;
        }

        if (formData.email && !validateEmail(formData.email)) {
            toast.error('Please enter a valid email address');
            setLoading(false);
            return;
        }

        if (formData.voterId && !validateStudentId(formData.voterId)) {
            toast.error('Please enter a valid WCU Student ID (format: WCU1234567 - exactly 7 digits)');
            setLoading(false);
            return;
        }

        if (formData.pass || formData.re_pass) {
            if (formData.pass !== formData.re_pass) {
                toast.error('Passwords do not match');
                setLoading(false);
                return;
            }
            if (formData.pass.length < 6) {
                toast.error('Password must be at least 6 characters long');
                setLoading(false);
                return;
            }
        }

        try {
            const voterId = Cookies.get('myCookie');
            if (!voterId) {
                toast.error('Session expired. Please login again.');
                navigate('/Login');
                return;
            }

            const isCandidate = userRole === 'candidate';
            const updateData = {
                name: formData.name,
                email: formData.email,
                voterId: formData.voterId
            };

            if (isCandidate) {
                if (formData.party) updateData.party = formData.party;
                if (formData.bio) updateData.bio = formData.bio;
                if (formData.cgpa && formData.cgpa !== '') {
                    const cgpaValue = parseFloat(formData.cgpa);
                    if (isNaN(cgpaValue) || cgpaValue < 0 || cgpaValue > 4.0) {
                        toast.error('CGPA must be a number between 0 and 4.0');
                        setLoading(false);
                        return;
                    }
                    updateData.cgpa = cgpaValue;
                }
            }

            if (formData.pass) {
                updateData.password = formData.pass;
            }

            const endpoint = isCandidate
                ? `${BASE_URL}/updateCandidate/${voterId}`
                : `${BASE_URL}/updateVoter/${voterId}`;

            const response = await axios.patch(endpoint, updateData);

            if (response.data.success) {
                toast.success('Profile updated successfully!');
                setFormData({
                    ...formData,
                    pass: '',
                    re_pass: ''
                });
                setTimeout(() => {
                    navigate('/User');
                }, 2000);
            } else {
                toast.error(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const msg = error.response?.data?.message || 'Failed to update profile. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
                <UserNavbar />
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pt: 20 }}>
                    <Stack spacing={2} alignItems="center">
                        <CircularProgress color="primary" />
                        <Typography variant="h6" color="text.secondary">Loading Profile...</Typography>
                    </Stack>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', transition: 'background-color 0.3s' }}>
            <UserNavbar />
            <Container maxWidth="md" sx={{ py: 6 }}>
                <ToastContainer />

                <Paper elevation={3} sx={{
                    p: { xs: 3, md: 5 },
                    borderRadius: 4,
                    backgroundColor: theme.palette.background.paper,
                    transition: 'all 0.3s'
                }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Typography variant="h3" component="h1" gutterBottom sx={{
                            fontWeight: 800,
                            color: colors.blueAccent[500],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2
                        }}>
                            <AccountCircleIcon sx={{ fontSize: 40 }} />
                            {userRole === 'candidate' ? 'Edit Candidate Profile' : 'My Account'}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Update your personal information and account security
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={5}>
                            {userRole === 'candidate' && (
                                <Alert
                                    icon={<AssessmentIcon fontSize="inherit" />}
                                    severity="info"
                                    sx={{ borderRadius: 2 }}
                                >
                                    <Typography variant="subtitle2" fontWeight={700}>Candidate Mode Enabled</Typography>
                                    You can update your candidate profile, bio, and department information here.
                                </Alert>
                            )}

                            {/* Section: Personal Information */}
                            <Box>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                    <PersonIcon sx={{ color: colors.blueAccent[500] }} /> Personal Information
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Full Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Student ID"
                                            name="voterId"
                                            value={formData.voterId}
                                            onChange={handleChange}
                                            required
                                            helperText="Format: WCU1234567"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Email Address"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider />

                            {/* Section: Candidate Details (Conditional) */}
                            {userRole === 'candidate' && (
                                <Box>
                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                        <SchoolIcon sx={{ color: colors.blueAccent[500] }} /> Candidate Details
                                    </Typography>

                                    {userData?.position ? (
                                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                                            <strong>Current Position:</strong> {userData.position}
                                        </Alert>
                                    ) : (
                                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                                            <strong>Position Pending:</strong> Will be assigned based on election results.
                                        </Alert>
                                    )}

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Department / Party"
                                                name="party"
                                                value={formData.party}
                                                onChange={handleChange}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SchoolIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="CGPA"
                                                name="cgpa"
                                                type="number"
                                                value={formData.cgpa}
                                                onChange={handleChange}
                                                inputProps={{ min: 0, max: 4.0, step: 0.01 }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <AssessmentIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Manifesto / Bio"
                                                name="bio"
                                                multiline
                                                rows={4}
                                                value={formData.bio}
                                                onChange={handleChange}
                                                placeholder="Tell voters about yourself..."
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                                            <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {userRole === 'candidate' && <Divider />}

                            {/* Section: Security */}
                            <Box>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                    <SecurityIcon sx={{ color: colors.blueAccent[500] }} /> Security
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="New Password"
                                            name="pass"
                                            type="password"
                                            value={formData.pass}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            placeholder="Leave blank to keep current"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <VpnKeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Confirm New Password"
                                            name="re_pass"
                                            type="password"
                                            value={formData.re_pass}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <VpnKeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ pt: 4, textAlign: 'right' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    sx={{
                                        px: 6,
                                        py: 1.8,
                                        borderRadius: 50,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        backgroundColor: colors.blueAccent[500],
                                        boxShadow: `0 8px 20px -8px ${colors.blueAccent[500]}`,
                                        '&:hover': {
                                            backgroundColor: colors.blueAccent[600],
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 12px 24px -10px ${colors.blueAccent[500]}`,
                                        },
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {loading ? 'Updating Profile...' : 'Save & Update Profile'}
                                </Button>
                            </Box>
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default EditProfile;
