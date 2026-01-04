import { useState, useEffect } from 'react';
import "./EditProfile.css";
import UserNavbar from "../../../Navbar/UserNavbar";
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        voterId: '',
        studentId: '', // For display purposes
        pass: '',
        re_pass: '',
        // Candidate-specific fields
        party: '',
        bio: '',
        cgpa: ''
    });
    const [userRole, setUserRole] = useState(null); // Track if user is candidate
    const [userData, setUserData] = useState(null); // Store user data to show position

    // Load current user data
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
                    setUserData(voter); // Store voter data to show position
                    setFormData({
                        name: voter.name || '',
                        email: voter.email || '',
                        voterId: voter.voterId || '',
                        studentId: voter.voterId || '',
                        pass: '',
                        re_pass: '',
                        // Candidate-specific fields
                        party: voter.party || voter.department || '',
                        bio: voter.bio || '',
                        cgpa: voter.cgpa || voter.age || '' // Use cgpa if available, fallback to age for backward compatibility
                        // Position is auto-assigned after election - not editable
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

        // Wait for user role to be loaded
        if (userRole === null) {
            toast.error('Please wait while we load your profile information...');
            setLoading(false);
            return;
        }

        // Validate email format
        if (formData.email && !validateEmail(formData.email)) {
            toast.error('Please enter a valid email address');
            setLoading(false);
            return;
        }

        // Validate student ID format if provided
        if (formData.voterId && !validateStudentId(formData.voterId)) {
            toast.error('Please enter a valid WCU Student ID (format: WCU1234567 - exactly 7 digits)');
            setLoading(false);
            return;
        }

        // Validate passwords match if password is being changed
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

            // Determine which endpoint and data to use based on role
            const isCandidate = userRole === 'candidate';

            // Prepare update data
            const updateData = {
                name: formData.name,
                email: formData.email,
                voterId: formData.voterId
            };

            // Add candidate-specific fields if user is a candidate
            if (isCandidate) {
                if (formData.party) updateData.party = formData.party;
                if (formData.bio) updateData.bio = formData.bio;
                // Position is auto-assigned after election - cannot be manually set
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

            // Add password if provided
            if (formData.pass) {
                updateData.password = formData.pass;
            }

            // Update profile using appropriate endpoint
            const endpoint = isCandidate
                ? `${BASE_URL}/updateCandidate/${voterId}`
                : `${BASE_URL}/updateVoter/${voterId}`;

            const response = await axios.patch(endpoint, updateData);

            if (response.data.success) {
                toast.success('Profile updated successfully!');
                // Clear password fields
                setFormData({
                    ...formData,
                    pass: '',
                    re_pass: ''
                });
                // Redirect to user page after 2 seconds
                setTimeout(() => {
                    navigate('/User');
                }, 2000);
            } else {
                toast.error(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to update profile. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div>
                <UserNavbar />
                <div className="loading-container">
                    <h2>Loading Profile...</h2>
                </div>
            </div>
        );
    }

    return (
        <div>
            <UserNavbar />
            <div className="edit-profile-wrapper">
                <div className="edit-profile-card">
                    <div className="edit-profile-header">
                        <h2>{userRole === 'candidate' ? 'Edit Candidate Profile' : 'Edit Personal Details'}</h2>
                        <p>Update your information and manage your account</p>
                    </div>

                    <ToastContainer position="top-right" autoClose={3000} />

                    <form onSubmit={handleSubmit} className="edit-profile-form">

                        {userRole === 'candidate' && (
                            <div className="info-box info">
                                <strong>Candidate Mode Enabled</strong><br />
                                You can edit your candidate information including party/department, bio, and CGPA securely here.
                            </div>
                        )}

                        <div className="form-section">
                            <h3 className="section-title">Personal Information</h3>
                            <div className="edit-profile-grid">
                                <div className="edit-profile-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                                <div className="edit-profile-group">
                                    <label htmlFor="voterId">Student ID</label>
                                    <input
                                        type="text"
                                        name="voterId"
                                        id="voterId"
                                        value={formData.voterId}
                                        onChange={handleChange}
                                        placeholder="e.g., WCU1234567"
                                        required
                                    />
                                </div>
                                <div className="edit-profile-group full-width">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="yourname@gmail.com"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {userRole === 'candidate' && (
                            <div className="edit-profile-section">
                                <h3 className="section-title">Candidate Details</h3>

                                {userData && userData.position && (
                                    <div className="info-box success">
                                        <strong>Current Position:</strong> {userData.position}<br />
                                        <span>(Assigned pending election results)</span>
                                    </div>
                                )}

                                {(!userData || !userData.position) && (
                                    <div className="info-box warning">
                                        <strong>Position Pending:</strong> Will be assigned based on election results.
                                    </div>
                                )}

                                <div className="edit-profile-grid">
                                    <div className="edit-profile-group">
                                        <label htmlFor="party">Department / Party</label>
                                        <input
                                            type="text"
                                            name="party"
                                            id="party"
                                            value={formData.party}
                                            onChange={handleChange}
                                            placeholder="e.g., Computer Science"
                                        />
                                    </div>
                                    <div className="edit-profile-group">
                                        <label htmlFor="cgpa">CGPA</label>
                                        <input
                                            type="number"
                                            name="cgpa"
                                            id="cgpa"
                                            value={formData.cgpa}
                                            onChange={handleChange}
                                            placeholder="e.g., 3.5"
                                            min="0"
                                            max="4.0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="edit-profile-group full-width">
                                        <label htmlFor="bio">Manifesto / Bio</label>
                                        <textarea
                                            name="bio"
                                            id="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            placeholder="Tell voters about yourself and your goals..."
                                            rows="4"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="edit-profile-section">
                            <h3 className="section-title">Security</h3>
                            <div className="edit-profile-grid">
                                <div className="edit-profile-group">
                                    <label htmlFor="pass">New Password</label>
                                    <input
                                        type="password"
                                        name="pass"
                                        id="pass"
                                        value={formData.pass}
                                        onChange={handleChange}
                                        placeholder="Leave blank to keep current"
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="edit-profile-group">
                                    <label htmlFor="re_pass">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="re_pass"
                                        id="re_pass"
                                        value={formData.re_pass}
                                        onChange={handleChange}
                                        placeholder="Repeat new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="edit-profile-actions">
                            <button
                                type="submit"
                                className="btn-save"
                                disabled={loading}
                            >
                                {loading ? 'Saving Changes...' : 'Save & Update Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default EditProfile;
