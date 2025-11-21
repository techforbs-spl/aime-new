import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
config();
import { healthRouter } from './routes/health.js';
import partnerRouter from './routes/partner.js';
import analyticsRouter from './routes/analytics.js';
import logsRouter from './routes/logs.js';
import personaRouter from './routes/persona.js';
import creatorRouter from './routes/creator.js';
import { z } from 'zod';

const FeatureFlags=z.object({
    FEATURE_ADMIN_ONLY:z.string().default('true'),
    FEATURE_PARTNER:z.string().default('false'),
    FEATURE_MEMBERS:z.string().default('false'),
    FEATURE_SIGNAL_NETWORK:z.string().default('false')
});

const flags=FeatureFlags.parse(process.env);
const app=express();

app.use(cors());
app.use(express.json());

app.get('/api/status',(_req,res)=>{
    res.json({
        env:process.env.NODE_ENV||'staging',
        flags,
        time:new Date().toISOString()
    });
});

app.use('/api/health',healthRouter);
app.use('/api/partner', partnerRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/persona', personaRouter);
app.use('/api/creator', creatorRouter);

app.post('/api/smoke/core',(req,res)=>{
    const ok=true;
    res.json({
        ok,
        steps:['auth','persona','trigger','event_log'],
        ts:Date.now()
    });
});

app.post('/api/signal/simulate',(req,res)=>{
    if(flags.FEATURE_SIGNAL_NETWORK!=='true'){
        return res.status(412).json({
            ok:false,
            msg:'Signal Network disabled in flags'
        });
    }
    const {keyword='demo'}=req.body||{};
    res.json({
        ok:true,
        routedCluster:'demo-cluster',
        keyword
    });
});

const PORT=Number(process.env.PORT||8080);

app.listen(PORT,()=>{
    console.log(`[AIME backend] listening on :${PORT}`);
});
