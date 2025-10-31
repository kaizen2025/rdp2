// src/components/common/Toast.js - Système de notification toast amélioré

import React from 'react';
import { Snackbar, Alert, Slide, Grow, AlertTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const SlideTransition = (props) => <Slide {...props} direction="up" />;
const GrowTransition = (props) => <Grow {...props} />;

const ICON_MAP = {
    success: <CheckCircleIcon />,
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />
};

const Toast = ({
    open,
    onClose,
    type = 'info',
    message,
    title,
    duration = 4000,
    position = { vertical: 'bottom', horizontal: 'right' },
    transition = 'slide'
}) => {
    const TransitionComponent = transition === 'slide' ? SlideTransition : GrowTransition;

    return (
        <Snackbar
            open={open}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={position}
            TransitionComponent={TransitionComponent}
        >
            <Alert
                onClose={onClose}
                severity={type}
                variant="filled"
                icon={ICON_MAP[type]}
                action={
                    <IconButton
                        size="small"
                        aria-label="close"
                        color="inherit"
                        onClick={onClose}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
                sx={{
                    minWidth: 300,
                    boxShadow: 3,
                    '& .MuiAlert-message': {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5
                    }
                }}
            >
                {title && <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>}
                {message}
            </Alert>
        </Snackbar>
    );
};

export default Toast;
