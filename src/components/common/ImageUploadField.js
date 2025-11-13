/**
 * Composant réutilisable pour l'upload de photos
 * Affiche une preview, permet upload/suppression
 */

import React, { useState, useRef } from 'react';
import {
    Box, Avatar, Button, IconButton, Typography, Tooltip
} from '@mui/material';
import {
    PhotoCamera, Delete, Person
} from '@mui/icons-material';

const ImageUploadField = ({
    currentImage,
    onUpload,
    onDelete,
    label = "Photo",
    size = 120,
    maxSizeKB = 500
}) => {
    const [previewUrl, setPreviewUrl] = useState(currentImage || null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation taille
        if (file.size > maxSizeKB * 1024) {
            setError(`Image trop volumineuse (max ${maxSizeKB}KB)`);
            return;
        }

        // Validation type
        if (!file.type.startsWith('image/')) {
            setError('Fichier doit être une image');
            return;
        }

        setError('');

        // Convertir en base64 pour preview et upload
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setPreviewUrl(base64String);
            if (onUpload) {
                onUpload(base64String);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = () => {
        setPreviewUrl(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">{label}</Typography>

            <Box sx={{ position: 'relative' }}>
                <Avatar
                    src={previewUrl || undefined}
                    sx={{
                        width: size,
                        height: size,
                        bgcolor: 'primary.main',
                        fontSize: size / 3
                    }}
                >
                    {!previewUrl && <Person sx={{ fontSize: size / 2 }} />}
                </Avatar>

                {previewUrl && (
                    <Tooltip title="Supprimer la photo">
                        <IconButton
                            size="small"
                            onClick={handleDelete}
                            sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'error.dark' }
                            }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current?.click()}
                size="small"
            >
                {previewUrl ? 'Changer' : 'Ajouter une photo'}
            </Button>

            {error && (
                <Typography variant="caption" color="error">
                    {error}
                </Typography>
            )}

            <Typography variant="caption" color="text.secondary">
                Max {maxSizeKB}KB • JPG, PNG, GIF
            </Typography>
        </Box>
    );
};

export default ImageUploadField;
