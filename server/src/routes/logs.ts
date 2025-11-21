import { Router } from 'express'
import { getSnapshot } from '../data/snapshots.js'

const logsRouter = Router()

logsRouter.get('/signals', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(snapshot.signals)
})

logsRouter.get('/comment-engine', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(snapshot.comments)
})

export default logsRouter






