
import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../helper";
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import UserNavbar from "../Navbar/UserNavbar";
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
    Stack
} from '@mui/material';

// MUI Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { tokens } from '../NewDashboard/theme';

const CandidateRegister = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [successText, setSuccessText] = useState("");

    const [formData, setFormData] = useState({
        bio: '',
        image: null,
        symbol: null,
        authenticatedDocument: null,
        position: '',
    });

    const [fileNames, setFileNames] = useState({
        image: '',
        symbol: '',
        authenticatedDocument: ''
    });

    const CreationSuccess = () => toast.success("Request successful. Candidate registration submitted! Waiting for admin approval.", {
        className: "toast-message",
    });

    const CreationFailed = (message) => toast.error(message || "Invalid Details \n Please Try Again!", {
        className: "toast-message",
    });

    // Check if user is logged in and fetch user information
    useEffect(() => {
        const voterId = Cookies.get('myCookie');
        if (voterId) {
            setIsLoggedIn(true);
            setUserId(voterId);

            const fetchUserInfo = async () => {
                try {
                    const response = await axios.get(`${BASE_URL}/getVoterbyID/${voterId}`);
                    if (response.data.success && response.data.voter) {
                        setUserInfo(response.data.voter);
                    }
                } catch (err) {
                    console.error('Error fetching user info:', err);
                } finally {
                    // loadingUserInfo logic removed
                }
            };
            fetchUserInfo();
        } else {
            // loadingUserInfo logic removed
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData({
                ...formData,
                [name]: files[0]
            });
            setFileNames({
                ...fileNames,
                [name]: files[0].name
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isLoggedIn || !userId) {
            CreationFailed("Please login first to register as a candidate.");
            setLoading(false);
            return;
        }

        if (!formData.authenticatedDocument) {
            CreationFailed('Authenticated document is required. Please upload a verified document proving you are a class representative.');
            setLoading(false);
            return;
        }

        if (!userInfo) {
            CreationFailed('Unable to load your registration information. Please try again.');
            setLoading(false);
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('fullName', userInfo.name || '');
        formDataToSend.append('party', userInfo.department || '');
        formDataToSend.append('bio', formData.bio);
        formDataToSend.append('userId', userId);

        if (formData.image) formDataToSend.append('image', formData.image);
        if (formData.symbol) formDataToSend.append('symbol', formData.symbol);
        formDataToSend.append('authenticatedDocument', formData.authenticatedDocument);

        try {
            const response = await axios.post(`${BASE_URL}/createCandidate`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                CreationSuccess();
                setSubmitSuccess(true);
                setSuccessText("Request successful. Your application has been sent and awaits admin approval.");
                setTimeout(() => {
                    navigate('/User');
                }, 2000)
            } else {
                CreationFailed(response.data.message || "Registration failed. Please try again.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Invalid Details \n Please Try Again!";
            CreationFailed(errorMessage);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



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
                            <HowToRegIcon sx={{ fontSize: 40 }} /> Register as Candidate
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Submit your application to become a candidate in the upcoming election
                        </Typography>
                    </Box>

                    {!isLoggedIn && (
                        <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
                            Something went wrong? <Link to="/Login" style={{ color: colors.blueAccent[500], fontWeight: 'bold' }}>Please login first</Link> to register as a candidate.
                        </Alert>
                    )}

                    {submitSuccess && (
                        <Alert icon={<CheckCircleOutlineIcon fontSize="inherit" />} severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                            <Typography variant="h6">Request Successful</Typography>
                            {successText}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        {isLoggedIn && (
                            <Stack spacing={4}>
                                <Alert icon={<InfoIcon fontSize="inherit" />} severity="info" sx={{ borderRadius: 2 }}>
                                    Your registration will be reviewed by an admin. You will be notified once approved.
                                </Alert>

                                {userInfo && (
                                    <Box sx={{
                                        p: 3,
                                        borderRadius: 3,
                                        backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : colors.grey[900],
                                        border: `1px solid ${colors.grey[800]}`
                                    }}>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                                            <AccountCircleIcon /> Your Profile Details
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Grid container spacing={2}>
                                            {[
                                                { label: 'Name', value: userInfo.name },
                                                { label: 'Email', value: userInfo.email },
                                                { label: 'Student ID', value: userInfo.voterId },
                                                { label: 'Department', value: userInfo.department },
                                                { label: 'College', value: userInfo.college }
                                            ].map((item, index) => (
                                                item.value && (
                                                    <Grid item xs={12} sm={6} key={index}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                                            {item.label}
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {item.value}
                                                        </Typography>
                                                    </Grid>
                                                )
                                            ))}
                                        </Grid>
                                        <Typography variant="caption" sx={{ mt: 2, display: 'block', fontStyle: 'italic', color: 'text.secondary' }}>
                                            Note: This information will be used for your official candidate profile.
                                        </Typography>
                                    </Box>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="h5" sx={{ fontWeight: 700 }}>Application Details</Typography>

                                <Grid container spacing={3}>


                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Candidate Bio"
                                            name="bio"
                                            multiline
                                            rows={4}
                                            value={formData.bio}
                                            onChange={handleChange}
                                            placeholder="Introduce yourself and your vision..."
                                            helperText="(Optional) This description will be visible to voters"
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>Profile Photo</Typography>
                                            <Button
                                                component="label"
                                                variant="outlined"
                                                startIcon={<CloudUploadIcon />}
                                                fullWidth
                                                sx={{ py: 1.5, borderStyle: 'dashed' }}
                                            >
                                                {fileNames.image || "Upload Photo"}
                                                <input type="file" hidden name="image" onChange={handleFileChange} accept="image/*" />
                                            </Button>
                                            <Typography variant="caption" color="text.secondary">Optional: Upload a clear personal photo</Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>Proposal Document</Typography>
                                            <Button
                                                component="label"
                                                variant="outlined"
                                                startIcon={<CloudUploadIcon />}
                                                fullWidth
                                                sx={{ py: 1.5, borderStyle: 'dashed' }}
                                            >
                                                {fileNames.symbol || "Upload Manifesto"}
                                                <input type="file" hidden name="symbol" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                                            </Button>
                                            <Typography variant="caption" color="text.secondary">Optional: Your manifesto or proposal</Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(219, 79, 74, 0.1)' : 'rgba(219, 79, 74, 0.05)',
                                            border: `1px solid ${colors.redAccent[500]}`
                                        }}>
                                            <Typography variant="subtitle2" color="error" gutterBottom sx={{ fontWeight: 700 }}>
                                                Authenticated Document (Required) *
                                            </Typography>
                                            <Button
                                                component="label"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<CloudUploadIcon />}
                                                fullWidth
                                                sx={{ py: 1.5, borderStyle: 'dashed' }}
                                            >
                                                {fileNames.authenticatedDocument || "Upload Verified Document"}
                                                <input type="file" hidden name="authenticatedDocument" onChange={handleFileChange} accept="image/*,.pdf" required />
                                            </Button>
                                            <Typography variant="caption" color="error">
                                                Please upload a verified document proving you are eligible for this position
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ textAlign: 'center', mt: 4 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={loading || !isLoggedIn}
                                        sx={{
                                            px: 8,
                                            py: 1.8,
                                            borderRadius: 50,
                                            fontSize: '1.1rem',
                                            backgroundColor: colors.blueAccent[500],
                                            '&:hover': { backgroundColor: colors.blueAccent[600] }
                                        }}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
                                    </Button>
                                </Box>
                            </Stack>
                        )}
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default CandidateRegister;
