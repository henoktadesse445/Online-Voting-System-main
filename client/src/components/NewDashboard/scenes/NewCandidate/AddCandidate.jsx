import { Box, Button, TextField } from "@mui/material";
// Removed Formik/yup for simpler local state handling
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../newComponents/Header";
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";
import { ColorModeContext, useMode } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ToastContainer, toast } from 'react-toastify';
import { useState } from "react";
import api from "../../../../api";
import { useNavigate } from 'react-router-dom';


const AddCandidate = () => {
    const [theme, colorMode] = useMode();
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const navigate = useNavigate();
    const CreationSuccess = () => toast.success("Candidate Created Successfully \n Click Anywhere to exit this screen", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const CreationFailed = () => toast.error("Invalid Details \n Please Try Again!", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });


    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        party: '',
        bio: '',
        image: null,
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
        if (name === 'image' && files && files[0]) {
            setImagePreview(URL.createObjectURL(files[0]));
        }
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        const formDataToSend = new FormData();
        for (const key in formData) {
            formDataToSend.append(key, formData[key]);
        }


        try {
            const response = await api.post(`/api/candidates/register`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                CreationSuccess();
                setTimeout(() => {
                    navigate('/Candidate');
                }, 200)
            }
            else {
                CreationFailed()
            }
        }
        catch (error) {
            CreationFailed();
            console.error(error);
        }
        finally {
            setLoading(false);
        }
    };




    // const handleFormSubmit = (values) => {
    //     console.log(values);
    // };

    return (<ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="appNew">
                <Sidebar />
                <main className="content">
                    <Topbar />
                    <ToastContainer />
                    <Box m="0px 20px">
                        <Header title="CREATE NEW CANDIDATE" subtitle="Create a New Candidate Profile" />
                        <br></br>

                        <form onSubmit={handleSubmit} encType="multipart/form-data">
                            <Box
                                display="grid"
                                gap="20px"
                                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                sx={{
                                    "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                                }}
                            >
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="text"
                                    label="Candidate Name"
                                    onChange={handleChange}
                                    value={formData.fullName}
                                    name="fullName"
                                    sx={{ gridColumn: "span 4" }}
                                />
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="text"
                                    label="Candidate CGPA"
                                    onChange={handleChange}
                                    value={formData.age}
                                    name="age"
                                    sx={{ gridColumn: "span 2" }}
                                />
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="text"
                                    label="Candidate Department"
                                    onChange={handleChange}
                                    value={formData.party}
                                    name="party"
                                    sx={{ gridColumn: "span 2" }}
                                />
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="text"
                                    label="Candidate Bio"
                                    onChange={handleChange}
                                    value={formData.bio}
                                    name="bio"
                                    sx={{ gridColumn: "span 4" }}
                                />
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="file"
                                    label="Candidate Image"
                                    onChange={handleFileChange}
                                    name="image"
                                    inputProps={{ accept: "image/*" }}
                                    sx={{ gridColumn: "span 2" }}
                                />
                                {imagePreview && (
                                    <Box sx={{ gridColumn: "span 2", display: 'flex', alignItems: 'center' }}>
                                        <img src={imagePreview} alt="Candidate Image Preview" style={{ maxHeight: 120, borderRadius: 8 }} />
                                    </Box>
                                )}
                            </Box>
                            <Box display="flex" justifyContent="end" mt="20px">
                                <Button type="submit" disabled={loading} color="secondary" variant="contained">
                                    {loading ? <div className="spinner"></div> : 'Create Candidate'}
                                </Button>
                            </Box>
                        </form>
                    </Box>

                </main>
            </div>
        </ThemeProvider>
    </ColorModeContext.Provider>

    )
};

export default AddCandidate;