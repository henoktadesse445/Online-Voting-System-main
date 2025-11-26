
import "./SignUtils/CSS/Sign.css";
import "./SignUtils/CSS/CandidateRegister.css";
import "./SignUtils/CSS/style.css.map"
import { ToastContainer, toast } from 'react-toastify';
import { useState, useEffect } from "react";
import axios from "axios"
import { BASE_URL } from "../../helper";
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';

const CandidateRegister = () => {
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingUserInfo, setLoadingUserInfo] = useState(true);

    const navigate = useNavigate();
    const CreationSuccess = () => toast.success("Candidate registration submitted! Waiting for admin approval.", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const CreationFailed = (message) => toast.error(message || "Invalid Details \n Please Try Again!",{
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
        cgpa: '',
        bio: '',
        image: null,
        symbol: null,
        authenticatedDocument: null,
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

        // Validate CGPA requirement (minimum 2.75)
        const cgpaValue = parseFloat(formData.cgpa);
        if (!formData.cgpa || isNaN(cgpaValue) || cgpaValue < 2.75) {
            CreationFailed('CGPA must be at least 2.75 to register as a candidate');
            setLoading(false);
            return;
        }

        // Position will be automatically assigned based on vote totals after election ends
        // No need to validate position selection

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
        formDataToSend.append('cgpa', formData.cgpa);
        // Position will be auto-assigned after election based on vote totals
        // formDataToSend.append('position', formData.position);
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
        <div >
            <section className="Candidatesignup">
                <div className="FormTitle">
                    <h2>Register as Candidate</h2>
                </div>

                {!isLoggedIn && (
                    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff3cd', margin: '20px auto', maxWidth: '600px', borderRadius: '5px' }}>
                        <p style={{ margin: 0, color: '#856404' }}>
                            <strong>Please login first to register as a candidate.</strong>
                        </p>
                        <Link to="/Login" style={{ color: '#2196F3', textDecoration: 'none' }}>Go to Login Page</Link>
                    </div>
                )}

                <div className="container">
                    <div className="signup-content">
                        <div className="signup-form">
                        <ToastContainer />

                            <form method="POST" enctype="multipart/form-data" className="register-form" id="register-form">
                                {isLoggedIn && (
                                    <>
                                        <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: '#d1ecf1', borderRadius: '5px', fontSize: '14px', color: '#0c5460' }}>
                                            Your registration will be reviewed by an admin. You will be notified once approved.
                                        </div>
                                        {userInfo && (
                                            <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px', border: '1px solid #ddd' }}>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Your Registration Information:</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
                                                    <div><strong>Name:</strong> {userInfo.name || 'N/A'}</div>
                                                    <div><strong>Email:</strong> {userInfo.email || 'N/A'}</div>
                                                    <div><strong>Student ID:</strong> {userInfo.voterId || 'N/A'}</div>
                                                    <div><strong>Department:</strong> {userInfo.department || 'N/A'}</div>
                                                    {userInfo.college && <div><strong>College:</strong> {userInfo.college}</div>}
                                                </div>
                                                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
                                                    This information will be used for your candidate profile.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#e3f2fd', borderRadius: '5px', border: '1px solid #2196F3' }}>
                                    <p style={{ margin: 0, color: '#1565c0', fontSize: '14px' }}>
                                        <strong>Position Assignment:</strong> Positions will be automatically assigned after the election ends based on the total number of votes you receive. The candidate with the highest votes becomes President, 2nd highest becomes Vice President, and so on.
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label for="cgpa"></label>
                                    <input type="number" name="cgpa" id="cgpa" value={formData.cgpa} onChange={handleChange} placeholder="Your CGPA - Minimum: 2.75" step="0.01" min="2.75" max="4.0" required />
                                    <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>Minimum CGPA required: 2.75</small>
                                </div>
                                <div className="form-group">
                                    <label for="bio"></label>
                                    <textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} placeholder="Candidate Bio (brief description)" rows="3" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}></textarea>
                                    <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>(Optional) Provide a brief description about yourself</small>
                                </div>

                                <div className="form-group">
                                    <label for="image"></label>
                                    <input type="file" name="image" id="image" onChange={handleFileChange} accept="image/*" />
                                    <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>(Optional) Upload your profile photo (Image file)</small>
                                </div>
                                <div className="form-group">
                                    <label for="symbol"></label>
                                    <input type="file" name="symbol" id="symbol" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                                    <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>(Optional) Upload your proposal document (PDF, DOC, DOCX, or Image)</small>
                                </div>
                                <div className="form-group">
                                    <label for="authenticatedDocument"></label>
                                    <input type="file" name="authenticatedDocument" id="authenticatedDocument" onChange={handleFileChange} accept="image/*,.pdf" required />
                                    <small style={{ display: 'block', marginTop: '5px', color: '#d32f2f', fontSize: '12px' }}>(Required) Upload your verified document proving you are a class representative (PDF or Image)</small>
                                </div>

                                <div className="form-group form-button">
                                    {/* <input type="submit" name="signup" id="signup" className="form-submit" value="Create Candidate" /> */}
                                    <button onClick={handleSubmit} disabled={loading || !isLoggedIn} className="form-submit">{loading ? <div className="spinner"></div> : 'Submit Application'}</button>
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
