import twilio from 'twilio';

export const triggerPanic = async (req, res) => {
  try {
    const { message = 'Emergency alert triggered — calling security' } = req.body || {};
    const to = (((req.body && req.body.to) || process.env.EMERGENCY_TO) || '').toString().trim();
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = (process.env.TWILIO_FROM || '').toString().trim();
    const envMode = (process.env.TWILIO_MODE || 'sms').toLowerCase();
    const mode = (req.body && typeof req.body.mode === 'string' ? req.body.mode : envMode).toLowerCase();

    if (!sid || !token || !from || !to) {
      const missing = {
        sid: !!sid,
        token: !!token,
        from: !!from,
        to: !!to,
      };
      const payload = { success: true, mode: 'fallback', message: 'Emergency alert triggered — calling security', missing };
      console.log('Panic fallback', payload);
      return res.json(payload);
    }

    const client = twilio(sid, token);
    if (mode === 'call') {
      const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;
      await client.calls.create({ from, to, twiml });
      const payload = { success: true, mode: 'twilio_call', message: 'Emergency call placed' };
      console.log('Panic call', { to, from, mode });
      return res.json(payload);
    } else {
      await client.messages.create({ from, to, body: message });
      const payload = { success: true, mode: 'twilio_sms', message: 'Emergency SMS sent' };
      console.log('Panic sms', { to, from, mode });
      return res.json(payload);
    }
  } catch (e) {
    const payload = { success: false, message: 'Failed to trigger panic', error: e?.message || 'error' };
    console.error('Panic error', payload);
    return res.status(500).json(payload);
  }
};

export const debugEmergency = (_req, res) => {
  const info = {
    has_sid: !!process.env.TWILIO_ACCOUNT_SID,
    has_token: !!process.env.TWILIO_AUTH_TOKEN,
    has_from: !!process.env.TWILIO_FROM,
    has_to: !!process.env.EMERGENCY_TO,
    mode: (process.env.TWILIO_MODE || 'sms').toLowerCase(),
  };
  return res.json(info);
};
