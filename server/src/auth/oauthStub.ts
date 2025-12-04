import express, { Request, Response } from "express";

const router = express.Router();

/**
 * GET /auth/stub/login
 * Simulates starting an OAuth login flow.
 */
router.get("/login", (req: Request, res: Response) => {
  const { redirect_uri, state } = req.query;

  return res.status(200).json({
    status: "ok",
    stub: true,
    step: "login",
    message: "OAuth stub login started (Sprint-2 placeholder only).",
    redirect_uri,
    state,
  });
});

/**
 * GET /auth/stub/callback
 * Simulates the OAuth provider redirecting back with a code.
 */
router.get("/callback", (req: Request, res: Response) => {
  const { code, state } = req.query;

  return res.status(200).json({
    status: "ok",
    stub: true,
    step: "callback",
    message: "OAuth stub callback received (Sprint-2 placeholder only).",
    code,
    state,
  });
});

/**
 * POST /auth/stub/token
 * Simulates exchanging a code for an access token.
 */
router.post("/token", (req: Request, res: Response) => {
  const { code } = req.body || {};

  return res.status(200).json({
    status: "ok",
    stub: true,
    step: "token",
    message: "OAuth stub token issued (Sprint-2 placeholder only).",
    code,
    access_token: "stub-access-token",
    expires_in: 3600,
  });
});

export default router;
