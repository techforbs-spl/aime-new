import { Router } from 'express'
import { getSnapshot } from '../data/snapshots.js'

const personaRouter = Router()

personaRouter.get('/list', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(snapshot.personas)
})

export default personaRouter






