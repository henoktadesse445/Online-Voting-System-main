import * as React from 'react';
import { useState, useRef } from 'react';
import { BASE_URL } from '../../../../helper';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Card,
    CardContent,
    Typography,
    Avatar,
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Default avatar image for users without a profile photo
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjxzdHlsZT4uc3R5bGUxe2ZvbnQtc2l6ZTo4MHB4fTwvc3R5bGU+PHRzcGFuIGNsYXNzPSJzdHlsZTEiPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDQ4IDUxMiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjOTk5Ij48cGF0aCBkPSJNMjI0IDI1NmMtNzAuNyAwLTEyOC01Ny4zLTEyOC0xMjhTMTUzLjMgMCAyMjQgMHMxMjggNTcuMyAxMjggMTI4LTU3LjMgMTI4LTEyOCAxMjh6bTg5LjYgMz廉lLTE5LjJjLTIwLjIgMTAtNDMuNCAxNi03NjQgMTYtMzEuNSAwLTU2LjItNi05NS40LTE2aC0xOS4yQzU3LjMgMjg4IDAgMzQ1LjMgMCA0MTYuMlY0MzJjMCA0NC4xIDM1LjkgODAgODAgODBoMjg4YzQ0LjEgMCA4MC0zNS45IDgwLTgwdi0xNi4yYzAtNzAuOS01Ni43LTEyOC0xMjh6Ii8+PC9zdmc+PC90c3Bhbj48L3RleHQ+PC9zdmc+';

export default function UserCard({ voter, onPhotoUpdate }) {
    const [uploading, setUploading] = useState(false);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState(voter.img || voter.image);
    const fileInputRef = useRef(null);

    // Get the profile photo URL - check both 'img' and 'image' fields
    const profilePhotoUrl = currentPhotoUrl || voter.img || voter.image;
    const fullPhotoUrl = profilePhotoUrl ? `${BASE_URL}${profilePhotoUrl}` : DEFAULT_AVATAR;

    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploading(true);

        try {
            const voterId = voter._id || Cookies.get('myCookie');
            if (!voterId) {
                alert('Session expired. Please login again.');
                return;
            }

            const formData = new FormData();
            formData.append('photo', file);

            const response = await axios.post(
                `${BASE_URL}/uploadVoterPhoto/${voterId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.success) {
                setCurrentPhotoUrl(response.data.img);
                alert('Profile photo updated successfully!');
                // Call parent callback if provided
                if (onPhotoUpdate) {
                    onPhotoUpdate(response.data.img);
                }
                // Reload page to show updated photo everywhere
                window.location.reload();
            } else {
                alert(response.data.message || 'Failed to upload photo');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card elevation={3} sx={{
            borderRadius: 4,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 2,
            backgroundColor: 'var(--card-bg)',
            backdropFilter: 'var(--backdrop-blur)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
        }}>
            <Box sx={{ position: 'relative', mt: 2, mb: 2 }}>
                <Avatar
                    src={fullPhotoUrl}
                    alt={voter.name || 'User Profile'}
                    sx={{ width: 150, height: 150, border: '4px solid var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}
                    imgProps={{ onError: (e) => { e.target.src = DEFAULT_AVATAR; } }}
                />
                <Tooltip title="Change Photo">
                    <IconButton
                        onClick={handlePhotoClick}
                        sx={{
                            position: 'absolute',
                            bottom: 5,
                            right: 5,
                            backgroundColor: '#1976d2',
                            color: 'white',
                            '&:hover': { backgroundColor: '#115293' }
                        }}
                        disabled={uploading}
                    >
                        {uploading ? <CircularProgress size={24} color="inherit" /> : <PhotoCamera />}
                    </IconButton>
                </Tooltip>

            </Box>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <CardContent sx={{ width: '100%', textAlign: 'center' }}>
                <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {voter.name || `${voter.firstName || ''} ${voter.lastName || ''}`}
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                        Student ID
                    </Typography>
                    <Typography variant="h6" color="text.primary">
                        {voter.voterId || voter.voterid || '-'}
                    </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Chip
                        icon={voter.voteStatus ? <CheckCircleIcon /> : <CancelIcon />}
                        label={voter.voteStatus ? "Voted" : "Not Voted"}
                        color={voter.voteStatus ? "success" : "error"}
                        variant={voter.voteStatus ? "filled" : "outlined"}
                        sx={{ fontWeight: 'bold', px: 1 }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
