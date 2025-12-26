/**
 * Dashboard analytique avancé pour les documents
 * Statistiques interactives avec Chart.js
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Alert,
    CircularProgress,
    Tooltip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Stack
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Description as DocumentIcon,
    Category as CategoryIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Insights as InsightsIcon
} from '@mui/icons-material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/backendConfig';

// Enregistrement des composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

function DocumentAnalyticsDashboard() {
    // États
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState(null);
    const [anomalies, setAnomalies] = useState([]);

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const apiBase = await getApiBaseUrl();
            const response = await axios.get(`${apiBase}/ai/analytics/documents`, {
                params: { timeRange }
            });

            if (response.data.success) {
                setStats(response.data.stats);
                setTrends(response.data.trends);
                setAnomalies(response.data.anomalies || []);
            }

        } catch (error) {
            console.error('[Analytics] Erreur chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const apiBase = await getApiBaseUrl();
            const response = await axios.get(`${apiBase}/ai/analytics/export`, {
                params: { format, timeRange },
                responseType: 'blob'
            });

            // Téléchargement du fichier
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics-${timeRange}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error('[Analytics] Erreur export:', error);
        }
    };

    // Configuration des graphiques

    const documentTrendChartData = trends ? {
        labels: trends.dates,
        datasets: [
            {
                label: 'Documents ajoutés',
                data: trends.documentsAdded,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Documents consultés',
                data: trends.documentsViewed,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.4,
                fill: true
            }
        ]
    } : null;

    const categoryChartData = stats ? {
        labels: Object.keys(stats.byCategory || {}),
        datasets: [{
            label: 'Documents par catégorie',
            data: Object.values(stats.byCategory || {}),
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(199, 199, 199, 0.7)',
                'rgba(83, 102, 255, 0.7)',
                'rgba(255, 99, 255, 0.7)',
                'rgba(99, 255, 132, 0.7)'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    } : null;

    const authorChartData = stats ? {
        labels: Object.keys(stats.byAuthor || {}).slice(0, 10),
        datasets: [{
            label: 'Documents par auteur',
            data: Object.values(stats.byAuthor || {}).slice(0, 10),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!stats) {
        return (
            <Alert severity="info">
                Aucune donnée analytique disponible pour la période sélectionnée.
            </Alert>
        );
    }

    return (
        <Box>
            {/* En-tête */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <InsightsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h5" fontWeight="bold">
                        Tableau de Bord Analytique
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Sélecteur de période */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Période</InputLabel>
                        <Select
                            value={timeRange}
                            label="Période"
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <MenuItem value="7d">7 derniers jours</MenuItem>
                            <MenuItem value="30d">30 derniers jours</MenuItem>
                            <MenuItem value="90d">3 derniers mois</MenuItem>
                            <MenuItem value="1y">1 an</MenuItem>
                            <MenuItem value="all">Toute la période</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Boutons d'action */}
                    <Tooltip title="Actualiser">
                        <IconButton onClick={loadAnalytics} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExport('xlsx')}
                    >
                        Exporter
                    </Button>
                </Box>
            </Box>

            {/* Cartes de statistiques principales */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DocumentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.total.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Documents totaux
                                    </Typography>
                                </Box>
                            </Box>
                            {stats.growth && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                    {stats.growth > 0 ? (
                                        <TrendingUpIcon sx={{ color: 'success.main' }} />
                                    ) : (
                                        <TrendingDownIcon sx={{ color: 'error.main' }} />
                                    )}
                                    <Typography
                                        variant="caption"
                                        color={stats.growth > 0 ? 'success.main' : 'error.main'}
                                    >
                                        {Math.abs(stats.growth)}% vs période précédente
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CategoryIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {Object.keys(stats.byCategory || {}).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Catégories
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Catégorie top: {Object.keys(stats.byCategory || {})[0] || 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PersonIcon sx={{ fontSize: 40, color: 'info.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {Object.keys(stats.byAuthor || {}).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Contributeurs
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Auteur top: {Object.keys(stats.byAuthor || {})[0] || 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.documentsThisWeek || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Cette semaine
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Moyenne: {Math.round((stats.documentsThisWeek || 0) / 7)} / jour
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Anomalies détectées */}
            {anomalies.length > 0 && (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {anomalies.length} anomalie(s) détectée(s)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {anomalies.slice(0, 3).map((anomaly, index) => (
                            <Typography key={index} variant="body2">
                                • {anomaly.message}
                            </Typography>
                        ))}
                    </Box>
                </Alert>
            )}

            {/* Graphiques */}
            <Grid container spacing={3}>
                {/* Tendances temporelles */}
                <Grid item xs={12} lg={8}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUpIcon />
                            Évolution des Documents
                        </Typography>
                        <Box sx={{ height: 320 }}>
                            {documentTrendChartData && (
                                <Line data={documentTrendChartData} options={chartOptions} />
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Distribution par catégorie (Doughnut) */}
                <Grid item xs={12} lg={4}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon />
                            Par Catégorie
                        </Typography>
                        <Box sx={{ height: 320, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {categoryChartData && (
                                <Doughnut data={categoryChartData} options={chartOptions} />
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Top auteurs */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon />
                            Top 10 Auteurs
                        </Typography>
                        <Box sx={{ height: 320 }}>
                            {authorChartData && (
                                <Bar data={authorChartData} options={chartOptions} />
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Tableau des catégories détaillées */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={2} sx={{ p: 3, height: 400, overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            Détail des Catégories
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Catégorie</TableCell>
                                        <TableCell align="right">Documents</TableCell>
                                        <TableCell align="right">%</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(stats.byCategory || {})
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([category, count]) => {
                                            const percentage = ((count / stats.total) * 100).toFixed(1);
                                            return (
                                                <TableRow key={category}>
                                                    <TableCell>
                                                        <Chip label={category} size="small" color="primary" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell align="right">{count.toLocaleString()}</TableCell>
                                                    <TableCell align="right">{percentage}%</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    }
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Statistiques de taille */}
                {stats.sizeStats && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Statistiques de Taille
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Taille totale:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {(stats.sizeStats.total / (1024 * 1024 * 1024)).toFixed(2)} GB
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Taille moyenne:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {(stats.sizeStats.avg / (1024 * 1024)).toFixed(2)} MB
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Plus petit:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {(stats.sizeStats.min / 1024).toFixed(2)} KB
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Plus grand:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {(stats.sizeStats.max / (1024 * 1024)).toFixed(2)} MB
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                )}

                {/* Activité récente */}
                {stats.recentActivity && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Activité Récente
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Stack spacing={2}>
                                {stats.recentActivity.map((activity, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CheckIcon sx={{ color: 'success.main' }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2">{activity.description}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(activity.timestamp).toLocaleString('fr-FR')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}

export default DocumentAnalyticsDashboard;
