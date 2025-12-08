
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
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        department: '',
        college: '',
        studentId: '',
        email: '',
        pass: '',
        re_pass: ''
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

            response = voterResponse;

            if (response.data.success) {
                signSuccess();
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
