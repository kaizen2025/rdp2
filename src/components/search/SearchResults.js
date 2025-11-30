// src/components/search/SearchResults.js - Résultats de recherche
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const SearchResults = ({ results = [], loading = false, onResultClick }) => {
    const theme = useTheme();

    if (loading) {
        return <Typography>Chargement...</Typography>;
    }

    if (!results || results.length === 0) {
        return (
            <Paper sx={{ p: 2 }}>
                <Typography color="text.secondary">Aucun résultat</Typography>
            </Paper>
        );
    }

    return (
        <List>
            {results.map((result, idx) => (
                <ListItem
                    key={idx}
                    button
                    onClick={() => onResultClick?.(result)}
                    sx={{
                        mb: 1,
                        borderRadius: 1,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                    }}
                >
                    <ListItemText
                        primary={result.name || result.title}
                        secondary={result.description || result.email}
                    />
                </ListItem>
            ))}
        </List>
    );
};

export default SearchResults;
