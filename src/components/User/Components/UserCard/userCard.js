import * as React from 'react';
import { useState, useRef } from 'react';
import './userCard.css';
import { BASE_URL } from '../../../../helper';
import axios from 'axios';
import Cookies from 'js-cookie';

// Default avatar image for users without a profile photo
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjxzdHlsZT4uc3R5bGUxe2ZvbnQtc2l6ZTo4MHB4fTwvc3R5bGU+PHRzcGFuIGNsYXNzPSJzdHlsZTEiPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDQ4IDUxMiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjOTk5Ij48cGF0aCBkPSJNMjI0IDI1NmMtNzAuNyAwLTEyOC01Ny4zLTEyOC0xMjhTMTUzLjMgMCAyMjQgMHMxMjggNTcuMyAxMjggMTI4LTU3LjMgMTI4LTEyOCAxMjh6bTg5LjYgMzJoLTE5LjJjLTIwLjIgMTAtNDMuNCAxNi03NjQgMTYtMzEuNSAwLTU2LjItNi05NS40LTE2aC0xOS4yQzU3LjMgMjg4IDAgMzQ1LjMgMCA0MTYuMlY0MzJjMCA0NC4xIDM1LjkgODAgODAgODBoMjg4YzQ0LjEgMCA4MC0zNS45IDgwLTgwdi0xNi4yYzAtNzAuOS01Ni43LTEyOC0xMjcuNC0xMjh6Ii8+PC9zdmc+PC90c3Bhbj48L3RleHQ+PC9zdmc+';

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
        <div>
            <div className='User-Card'>
                <div className='userImage'>
                    <div className='profile-photo-wrapper'>
                        <img 
                            src={fullPhotoUrl} 
                            alt={voter.name || 'User Profile'} 
                            onError={(e) => {
                                // Fallback to default avatar if image fails to load
                                e.target.src = DEFAULT_AVATAR;
                            }}
                        />
                        <div className='photo-overlay' onClick={handlePhotoClick}>
                            <span className='upload-icon'></span>
                            <span className='upload-text'>
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </span>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div><br />
                <div className='userDetails1'>
                    <p><h6>Name: &nbsp; {voter.name || `${voter.firstName || ''} ${voter.lastName || ''}`}</h6> </p>
                    <p><h6>Student ID: &nbsp;{voter.voterId || voter.voterid || '-'}</h6>  </p>
                    <p><h6>Voter Status: &nbsp;{voter.voteStatus && (<span className='Voted'>Voted</span>)}{(!voter.voteStatus) && (<span className='notVoted'>Not Voted</span>)}</h6>  </p>
                </div>
            </div>
        </div>
    );
}
