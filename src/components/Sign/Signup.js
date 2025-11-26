
import "./SignUtils/CSS/Sign.css";
import signupimage from "./SignUtils/images/signup-image.jpg"
import { Link } from 'react-router-dom';
import "./SignUtils/CSS/style.css.map"
import Nav_bar from "../Navbar/Navbar";
import { useState, useEffect } from "react";
import axios from "axios"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from "../../helper";
import { useNavigate } from 'react-router-dom';

const collegeDepartmentMapping = {
    "College of Engineering": ["Computer Science", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering"],
    "College of Business and Economics": ["Business Administration", "Economics", "Accounting", "Management"],
    "College of Natural and Computational Sciences": ["Mathematics", "Physics", "Chemistry", "Biology"],
    "College of Social Sciences and Humanities": ["Psychology", "Sociology", "History", "Geography"],
    "College of Agriculture": ["Agronomy", "Animal Science", "Plant Science", "Agricultural Economics"],
    "College of Health Sciences": ["Medicine", "Nursing", "Pharmacy", "Public Health"],
    "College of Education": ["Educational Psychology", "Curriculum and Instruction", "Educational Leadership", "Special Needs Education"],
    "College of Law": ["Constitutional Law", "Criminal Law", "Commercial Law", "International Law"],
    "College of Veterinary Medicine": ["Veterinary Medicine", "Animal Health", "Veterinary Public Health"],
    "College of Technology": ["Computer Science", "Information Technology", "Software Engineering", "Network Engineering", "Database Management"],
};

export default function Signup() {
    const navigate = useNavigate();

    const signSuccess = () => toast.success("Student Registered Successfully for Wachemo University Elections \n Redirecting You To Login Page", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const signFailed = (msg) => toast.error(`${msg}`, {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const [loading, setLoading] = useState(false);
    const [age, setAge] = useState();
    const [registrationType, setRegistrationType] = useState('voter'); // 'voter' or 'candidate'
    const [showEligibilityInfo, setShowEligibilityInfo] = useState(true);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        department: '',
        college: '',
        studentId: '',
        email: '',
        pass: '',
        re_pass: '',
        // Candidate-specific fields
        bio: '',
        cgpa: '',
        image: null,
        symbol: null,
        authenticatedDocument: null
    });

    function calculateAge(dateOfBirth) {
        const dob = new Date(dateOfBirth);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        const dayDifference = today.getDate() - dob.getDate();

        // Adjust age if the birthdate hasn't occurred yet this year
        if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
            age--;
        }

        return age;
    }

    function validateStudentId(studentId) {
        const normalized = String(studentId).trim().toUpperCase().replace(/^WCUR/, 'WCU');
        const wcuPattern = /^WCU\d{7}$/;
        return wcuPattern.test(normalized);
    }

    function validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // Ensure form fields are empty on component mount
    useEffect(() => {
        // Clear any browser autofill by resetting form data
        setFormData({
            firstName: '',
            lastName: '',
            department: '',
            college: '',
            studentId: '',
            email: '',
            pass: '',
            re_pass: ''
        });
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
        setFormData({
            ...formData,
            [name]: files[0]
        });
    };

    const departments = collegeDepartmentMapping[formData.college] || [];

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        
        // Validate passwords match
        if (formData.pass !== formData.re_pass) {
            alert('Passwords do not match');
            setLoading(false);
            return;
        }

        const normalizedStudentId = String(formData.studentId).trim().toUpperCase().replace(/^WCUR/, 'WCU');
        if (!validateStudentId(normalizedStudentId)) {
            alert('Please enter a valid WCU Student ID (format: WCU1411395 - exactly 7 digits)');
            setLoading(false);
            return;
        }
        
        // Validate general email format
        if (!validateEmail(formData.email)) {
            alert('Please enter a valid email address');
            setLoading(false);
            return;
        }


        try {
            let response;
            
            // Create voter account first (without files - files are handled separately for candidates)
            const voterFormData = new FormData();
            voterFormData.append('firstName', formData.firstName);
            voterFormData.append('lastName', formData.lastName);
            voterFormData.append('department', formData.department);
            voterFormData.append('college', formData.college);
            voterFormData.append('studentId', normalizedStudentId);
            voterFormData.append('email', formData.email);
            voterFormData.append('pass', formData.pass);

            const voterResponse = await axios.post(`${BASE_URL}/createVoter`, voterFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (!voterResponse.data.success) {
                signFailed(voterResponse.data.message || "Registration failed");
                setLoading(false);
                return;
            }

            // If registering as candidate, now create candidate profile
            if (registrationType === 'candidate') {
                if (!formData.bio) {
                    alert('Please fill in the Bio field for candidate registration');
                    setLoading(false);
                    return;
                }

                // Validate CGPA requirement (minimum 2.75)
                const cgpaValue = parseFloat(formData.cgpa);
                if (isNaN(cgpaValue) || cgpaValue < 2.75) {
                    alert('CGPA must be at least 2.75 to register as a candidate');
                    setLoading(false);
                    return;
                }

                // Validate authenticated document is required
                if (!formData.authenticatedDocument) {
                    alert('Authenticated document is required. Please upload a verified document proving you are a class representative.');
                    setLoading(false);
                    return;
                }


                const candidateFormData = new FormData();
                candidateFormData.append('fullName', `${formData.firstName} ${formData.lastName}`);
                // Use department from registration form as party field
                candidateFormData.append('party', formData.department);
                candidateFormData.append('bio', formData.bio);
                candidateFormData.append('age', formData.cgpa); // Using cgpa value for age field (backend compatibility)
                candidateFormData.append('userId', voterResponse.data.userId);
                
                // Add files if provided
                if (formData.image) {
                    candidateFormData.append('image', formData.image);
                }
                if (formData.symbol) {
                    candidateFormData.append('symbol', formData.symbol);
                }
                // Add authenticated document (required)
                candidateFormData.append('authenticatedDocument', formData.authenticatedDocument);

                response = await axios.post(`${BASE_URL}/createCandidate`, candidateFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            } else {
                // Regular voter registration - already done
                response = voterResponse;
            }
            
            if (response.data.success) {
                if (registrationType === 'candidate') {
                    toast.success("Candidate registration submitted successfully! Your application is pending admin approval. Redirecting to Login...", {
                        className: "toast-message",
                    });
                } else {
                signSuccess();
                }
                setTimeout(() => {
                    navigate('/Login');
                }, 2000)
            }
            else {
                signFailed(response.data.message || "Invalid Details");
            }
        }
        catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.message) {
                signFailed(error.response.data.message);
            } else if (error.message) {
                signFailed(error.message);
            } else {
                signFailed("Network error. Please check if the server is running.");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="Sign-Container" >
            <Nav_bar />
            <section className="signup">
                <div className="container">
                    <div className="signup-content">
                        <div className="signup-form">
                            <h2 className="form-title">Wachemo University Student Registration</h2>
                            <form method="POST" enctype="multipart/form-data" className="register-form" id="register-form">
                                <ToastContainer />
                                
                                <div className="form-group">
                                    <label for="firstName"><i className="zmdi zmdi-account material-icons-name"></i></label>
                                    <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} placeholder="Your First Name" required />
                                </div>
                                <div className="form-group">
                                    <label for="lastName"><i className="zmdi zmdi-account-box material-icons-name"></i></label>
                                    <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Your Last Name" required />
                                </div>
                                <div className="form-group">
                                    <label for="college"><i className="zmdi zmdi-school material-icons-name"></i></label>
                                    <select name="college" id="college" value={formData.college} onChange={handleChange} required>
                                        <option value="">Select Your College</option>
                                        {Object.keys(collegeDepartmentMapping).map((college) => (
                                            <option key={college} value={college}>{college}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label for="department"><i className="zmdi zmdi-book material-icons-name"></i></label>
                                    <select name="department" id="department" value={formData.department} onChange={handleChange} required>
                                        <option value="">Select Your Department</option>
                                        {departments.map((department) => (
                                            <option key={department} value={department}>{department}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label for="studentId"><i className="zmdi zmdi-file-text material-icons-name"></i></label>
                                    <input type="text" name="studentId" id="studentId" value={formData.studentId} onChange={handleChange} placeholder="Your Student ID (e.g., WCU1411395)" required />
                                </div>
                                <div className="form-group">
                                    <label for="email"><i className="zmdi zmdi-email"></i></label>
                                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} placeholder="Your Gmail Address (e.g., yourname@gmail.com)" autoComplete="off" required />
                                </div>
                                <div className="form-group">
                                    <label for="pass"><i className="zmdi zmdi-lock"></i></label>
                                    <input type="password" name="pass" id="pass" value={formData.pass} onChange={handleChange} placeholder="Password" autoComplete="new-password" required />
                                </div>
                                <div className="form-group">
                                    <label for="re-pass"><i className="zmdi zmdi-lock-outline"></i></label>
                                    <input type="password" name="re_pass" id="re_pass" value={formData.re_pass} onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" required />
                                </div>

                                {/* Candidate-specific fields - only show if registering as candidate */}
                                {registrationType === 'candidate' && (
                                    <>
                                        <div style={{ margin: '20px 0', padding: '10px', borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                <h3 style={{ margin: 0, fontSize: '18px' }}>Candidate Information</h3>
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowEligibilityInfo(!showEligibilityInfo)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#fff3cd',
                                                        border: '1px solid #ffc107',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        color: '#856404',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ffe082';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#fff3cd';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    {showEligibilityInfo ? 'Hide' : 'Show'} Requirements
                                                </button>
                                            </div>
                                            {showEligibilityInfo && (
                                                <div style={{ 
                                                    marginBottom: '15px', 
                                                    padding: '15px', 
                                                    backgroundColor: '#fff3cd', 
                                                    borderRadius: '8px', 
                                                    borderLeft: '4px solid #ffc107', 
                                                    fontSize: '14px', 
                                                    color: '#856404',
                                                    animation: 'fadeIn 0.3s ease-in',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                        <div>
                                                            <strong style={{ display: 'block', marginBottom: '8px' }}>Eligibility Requirement:</strong>
                                                            <p style={{ margin: 0, lineHeight: '1.6' }}>
                                                                Only class representatives are eligible to register as candidates. You must upload an authenticated document from the head office verifying your status as a class representative. This document will be reviewed by administrators during the approval process.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label for="cgpa"></label>
                                            <input type="number" name="cgpa" id="cgpa" value={formData.cgpa} onChange={handleChange} placeholder="Your CGPA - Minimum: 2.75" step="0.01" min="2.75" max="4.0" required={registrationType === 'candidate'} />
                                            <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>Minimum CGPA required: 2.75</small>
                                        </div>
                                        <div className="form-group">
                                            <label for="bio"></label>
                                            <textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} placeholder="Candidate Bio (brief description)" rows="3" required={registrationType === 'candidate'} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}></textarea>
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
                                    </>
                                )}

                                {/* Registration Type Selection - At the bottom, right side */}
                                <div className="form-group" style={{ 
                                    marginTop: '25px', 
                                    marginBottom: '15px', 
                                    padding: '20px', 
                                    backgroundColor: '#f8f9fa', 
                                    borderRadius: '10px', 
                                    border: '2px solid #e0e0e0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <label style={{ 
                                        marginBottom: '15px', 
                                        fontWeight: 'bold', 
                                        fontSize: '16px',
                                        color: '#333',
                                        alignSelf: 'flex-start',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <i className="zmdi zmdi-account-circle material-icons-name" style={{ fontSize: '20px', color: '#2196F3' }}></i> 
                                        <span>Register as:</span>
                                    </label>
                                    <div style={{ 
                                        display: 'flex', 
                                        gap: '12px', 
                                        alignSelf: 'flex-end',
                                        flexWrap: 'wrap'
                                    }}>
                                        <label 
                                            onClick={() => setRegistrationType('voter')}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                cursor: 'pointer',
                                                padding: '12px 20px',
                                                borderRadius: '8px',
                                                border: registrationType === 'voter' ? '2px solid #4CAF50' : '2px solid #ddd',
                                                backgroundColor: registrationType === 'voter' ? '#e8f5e9' : '#fff',
                                                transition: 'all 0.3s ease',
                                                fontWeight: registrationType === 'voter' ? '600' : '400',
                                                boxShadow: registrationType === 'voter' ? '0 2px 6px rgba(76, 175, 80, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (registrationType !== 'voter') {
                                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                                    e.currentTarget.style.borderColor = '#4CAF50';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (registrationType !== 'voter') {
                                                    e.currentTarget.style.backgroundColor = '#fff';
                                                    e.currentTarget.style.borderColor = '#ddd';
                                                }
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="registrationType"
                                                value="voter"
                                                checked={registrationType === 'voter'}
                                                onChange={(e) => setRegistrationType(e.target.value)}
                                                style={{ 
                                                    marginRight: '10px',
                                                    width: '18px',
                                                    height: '18px',
                                                    cursor: 'pointer',
                                                    accentColor: '#4CAF50'
                                                }}
                                            />
                                            <span style={{ fontSize: '15px', userSelect: 'none' }}>Voter</span>
                                        </label>
                                        <label 
                                            onClick={() => setRegistrationType('candidate')}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                cursor: 'pointer',
                                                padding: '12px 20px',
                                                borderRadius: '8px',
                                                border: registrationType === 'candidate' ? '2px solid #FF9800' : '2px solid #ddd',
                                                backgroundColor: registrationType === 'candidate' ? '#fff3e0' : '#fff',
                                                transition: 'all 0.3s ease',
                                                fontWeight: registrationType === 'candidate' ? '600' : '400',
                                                boxShadow: registrationType === 'candidate' ? '0 2px 6px rgba(255, 152, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (registrationType !== 'candidate') {
                                                    e.currentTarget.style.backgroundColor = '#fff9e6';
                                                    e.currentTarget.style.borderColor = '#FF9800';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (registrationType !== 'candidate') {
                                                    e.currentTarget.style.backgroundColor = '#fff';
                                                    e.currentTarget.style.borderColor = '#ddd';
                                                }
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="registrationType"
                                                value="candidate"
                                                checked={registrationType === 'candidate'}
                                                onChange={(e) => setRegistrationType(e.target.value)}
                                                style={{ 
                                                    marginRight: '10px',
                                                    width: '18px',
                                                    height: '18px',
                                                    cursor: 'pointer',
                                                    accentColor: '#FF9800'
                                                }}
                                            />
                                            <span style={{ fontSize: '15px', userSelect: 'none' }}>Candidate</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group form-button">
                                    {/* <input type="submit" name="signup" id="signup" className="form-submit" value="Submit" /> */}
                                    <button onClick={handleSubmit} disabled={loading}>{loading ? <div className="spinner"></div> : 'Register'}</button>
                                </div>
                            </form>
                        </div>
                        <div className="signup-image">
                            <figure><img src={signupimage} alt="sing up image" /></figure>
                            <Link to='/Login' className="signup-image-link">I am already member</Link>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )

}
