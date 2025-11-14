import React from 'react';
import { Box, Toolbar, Typography, Tooltip, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

const BulkActionsToolbar = ({ numSelected, onBulkDelete, onBulkEdit }) => {
    return (
        <Toolbar
            sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                ...(numSelected > 0 && {
                    bgcolor: (theme) => theme.palette.secondary.lighter,
                }),
                borderRadius: 1
            }}
        >
            {numSelected > 0 ? (
                <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
                    {numSelected} sélectionné(s)
                </Typography>
            ) : (
                <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
                    Matériel
                </Typography>
            )}

            {numSelected > 0 && (
                <>
                    <Tooltip title="Modifier en masse">
                        <IconButton onClick={onBulkEdit}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer en masse">
                        <IconButton onClick={onBulkDelete}>
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </>
            )}
        </Toolbar>
    );
};

export default BulkActionsToolbar;
