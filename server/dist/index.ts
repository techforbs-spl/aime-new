import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import personaRoutes from './routes/persona';
import creatorRoutes from './routes/creator';
import analyticsRoutes from './routes/analytics';
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'AIME Core API', sprint: '2' });
});
app.use('/persona', personaRoutes);
app.use('/creator', creatorRoutes);
app.use('/analytics', analyticsRoutes);
// Fallback 404
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`AIME Core API listening on port ${PORT}`);
});
export default app;
