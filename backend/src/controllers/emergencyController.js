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
    // Support multiple numbers separated by comma
    const numbers = to.split(',').map(n => n.trim()).filter(n => n);
    
    if (mode === 'call') {
      const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;
      for (const num of numbers) {
        await client.calls.create({ from, to: num, twiml });
      }
      const payload = { success: true, mode: 'twilio_call', message: `Emergency call placed to ${numbers.length} number(s)` };
      console.log('Panic call', { to: numbers, from, mode });
      return res.json(payload);
    } else {
      for (const num of numbers) {
        await client.messages.create({ from, to: num, body: message });
      }
      const payload = { success: true, mode: 'twilio_sms', message: `Emergency SMS sent to ${numbers.length} number(s)` };
      console.log('Panic sms', { to: numbers, from, mode });
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
