import { Router } from 'express';
import {
  initiateGmailOAuth,
  handleGmailCallback,
  initiateOutlookOAuth,
  handleOutlookCallback,
} from './oauth';

const router = Router();

// Gmail OAuth routes
router.get('/oauth/gmail', initiateGmailOAuth);
router.get('/oauth/gmail/callback', handleGmailCallback);

// Outlook OAuth routes
router.get('/oauth/outlook', initiateOutlookOAuth);
router.get('/oauth/outlook/callback', handleOutlookCallback);

export default router;
