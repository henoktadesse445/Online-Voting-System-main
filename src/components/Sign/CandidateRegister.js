
import "./SignUtils/CSS/Sign.css";
import "./SignUtils/CSS/CandidateRegister.css";
import "./SignUtils/CSS/style.css.map"
import { ToastContainer, toast } from 'react-toastify';
import { useState, useEffect } from "react";
import axios from "axios"
import { BASE_URL } from "../../helper";
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import UserNavbar from "../Navbar/UserNavbar";

const CandidateRegister = () => {
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingUserInfo, setLoadingUserInfo] = useState(true);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [successText, setSuccessText] = useState("");

    const navigate = useNavigate();
    const CreationSuccess = () => toast.success("Request successful. Candidate registration submitted! Waiting for admin approval.", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const CreationFailed = (message) => toast.error(message || "Invalid Details \n Please Try Again!", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });

    // Check if user is logged in and fetch user information
    useEffect(() => {
        const voterId = Cookies.get('myCookie');
        if (voterId) {
            setIsLoggedIn(true);
            setUserId(voterId);

            // Fetch user information from registration
            const fetchUserInfo = async () => {
                try {
                    const response = await axios.get(`${BASE_URL}/getVoterbyID/${voterId}`);
                    if (response.data.success && response.data.voter) {
                        setUserInfo(response.data.voter);
                    }
                } catch (err) {
                    console.error('Error fetching user info:', err);
                } finally {
                    setLoadingUserInfo(false);
                }
            };
            fetchUserInfo();
        } else {
            setLoadingUserInfo(false);
        }
    }, []);


    const [formData, setFormData] = useState({
        bio: '',
        image: null,
        symbol: null,
        authenticatedDocument: null,
        position: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData({
            ...formData,
            [name]: files[0]
        });
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        // Check if user is logged in for self-registration
        if (!isLoggedIn || !userId) {
            CreationFailed("Please login first to register as a candidate.");
            setLoading(false);
            return;
        }

        // CGPA validation removed - no longer required

        // Validate position selection
        if (!formData.position) {
            CreationFailed('Please select a position you are running for.');
            setLoading(false);
            return;
        }

        // Validate authenticated document is required
        if (!formData.authenticatedDocument) {
            CreationFailed('Authenticated document is required. Please upload a verified document proving you are a class representative.');
            setLoading(false);
            return;
        }

        // Use user information from registration
        if (!userInfo) {
            CreationFailed('Unable to load your registration information. Please try again.');
            setLoading(false);
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('fullName', userInfo.name || ''); // Use name from user registration
        formDataToSend.append('party', userInfo.department || ''); // Use department from user registration
        formDataToSend.append('bio', formData.bio);
        // CGPA field removed - no longer required
        // Position will be auto-assigned after election based on vote totals
        formDataToSend.append('position', formData.position);
        formDataToSend.append('userId', userId);

        // Add files if provided
        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }
        if (formData.symbol) {
            formDataToSend.append('symbol', formData.symbol);
        }
        // Authenticated document is required
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
            }
            else {
                CreationFailed(response.data.message || "Registration failed. Please try again.");
            }
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || "Invalid Details \n Please Try Again!";
            CreationFailed(errorMessage);
            console.error(error);
        }
        finally {
            setLoading(false);
        }
    };


    return (
        <div>
            <UserNavbar />
            <section className="candidate-register-section">
                <div className="candidate-register-wrapper">
                    <div className="candidate-register-card">
                        <div className="form-header">
                            <h2>Register as Candidate</h2>
                            <p className="subtitle">Submit your application to become a candidate</p>
                        </div>

                        {!isLoggedIn && (
                            <div className="status-box warning">
                                <p><strong>Please login first to register as a candidate.</strong></p>
                                <Link to="/Login" className="action-link">Go to Login Page</Link>
                            </div>
                        )}

                        <div className="form-body">
                            <ToastContainer />

                            {submitSuccess && (
                                <div className="status-box success">
                                    <h4>Request Successful</h4>
                                    <p>{successText}</p>
                                </div>
                            )}

                            <form method="POST" encType="multipart/form-data" className="register-form">
                                {isLoggedIn && (
                                    <>
                                        <div className="info-box info">
                                            Your registration will be reviewed by an admin. You will be notified once approved.
                                        </div>

                                        {userInfo && (
                                            <div className="user-profile-summary">
                                                <h4>Your Profile</h4>
                                                <div className="profile-grid">
                                                    <div className="profile-item">
                                                        <span className="label">Name</span>
                                                        <span className="value">{userInfo.name || 'N/A'}</span>
                                                    </div>
                                                    <div className="profile-item">
                                                        <span className="label">Email</span>
                                                        <span className="value">{userInfo.email || 'N/A'}</span>
                                                    </div>
                                                    <div className="profile-item">
                                                        <span className="label">Student ID</span>
                                                        <span className="value">{userInfo.voterId || 'N/A'}</span>
                                                    </div>
                                                    <div className="profile-item">
                                                        <span className="label">Department</span>
                                                        <span className="value">{userInfo.department || 'N/A'}</span>
                                                    </div>
                                                    {userInfo.college && (
                                                        <div className="profile-item">
                                                            <span className="label">College</span>
                                                            <span className="value">{userInfo.college}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="note">This information will be used for your candidate profile.</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="form-field required-field">
                                    <label htmlFor="position">Position You Are Running For <span className="required">*</span></label>
                                    <select
                                        name="position"
                                        id="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                        required
                                        className="form-select"
                                    >
                                        <option value="">-- Select Position --</option>
                                        <option value="President">President</option>
                                        <option value="Vice President">Vice President</option>
                                        <option value="Secretary">Secretary</option>
                                        <option value="Finance Officer">Finance Officer</option>
                                        <option value="Public Relations Officer">Public Relations Officer</option>
                                        <option value="Sports & Recreation Officer">Sports & Recreation Officer</option>
                                        <option value="Gender and Equality Officer">Gender and Equality Officer</option>
                                    </select>
                                    <small>Select the student union position you wish to run for</small>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="bio">Candidate Bio</label>
                                    <textarea
                                        name="bio"
                                        id="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Tell us about yourself..."
                                        rows="4"
                                    ></textarea>
                                    <small>(Optional) A brief description that will appear on your public profile</small>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label htmlFor="image">Profile Photo</label>
                                        <div className="file-input-wrapper">
                                            <input type="file" name="image" id="image" onChange={handleFileChange} accept="image/*" />
                                        </div>
                                        <small>(Optional) Upload a clear photo of yourself</small>
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="symbol">Proposal Document</label>
                                        <div className="file-input-wrapper">
                                            <input type="file" name="symbol" id="symbol" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                                        </div>
                                        <small>(Optional) Your manifesto or proposal</small>
                                    </div>
                                </div>

                                <div className="form-field required-field">
                                    <label htmlFor="authenticatedDocument">Authenticated Document <span className="required">*</span></label>
                                    <div className="file-input-wrapper">
                                        <input type="file" name="authenticatedDocument" id="authenticatedDocument" onChange={handleFileChange} accept="image/*,.pdf" required />
                                    </div>
                                    <small className="error-text">Upload a verified document proving you are a class representative</small>
                                </div>

                                <div className="form-actions">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !isLoggedIn}
                                        className="btn-submit"
                                    >
                                        {loading ? <div className="spinner-small"></div> : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
export default CandidateRegister;
