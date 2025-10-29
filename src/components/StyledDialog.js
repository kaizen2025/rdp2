// src/components/StyledDialog.js
import React from 'react';
import { Dialog, Grow } from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Grow ref={ref} {...props} />;
});

const StyledDialog = (props) => {
    return <Dialog TransitionComponent={Transition} {...props} />;
};

export default StyledDialog;
