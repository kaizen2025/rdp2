import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ErrorIcon from '@mui/icons-material/Error';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error: error, errorInfo: errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 2, m: 'auto', maxWidth: 600 }}>
                    <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'error.lighter' }}>
                        <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Oops! Quelque chose s'est mal passé.
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Nous avons rencontré une erreur inattendue. Essayez de rafraîchir la page ou de contacter le support si le problème persiste.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => window.location.reload()}
                        >
                            Rafraîchir la page
                        </Button>
                        {process.env.NODE_ENV === 'development' && (
                            <Box sx={{ mt: 3, textAlign: 'left', bgcolor: 'background.paper', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                                <Typography variant="subtitle2">Détails de l'erreur :</Typography>
                                <Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {this.state.error && this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
