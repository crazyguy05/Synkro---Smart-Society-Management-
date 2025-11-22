import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.post("/panic", async (req, res) => {
  console.log("\uD83D\uDEA8 Panic endpoint hit", req.body);

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const call = await client.calls.create({
      to: process.env.EMERGENCY_TO,
      from: process.env.TWILIO_FROM,
      twiml: `<Response><Say voice="alice">Emergency alert test from Smart Society OS.</Say></Response>`,
    });

    console.log("\u2705 Twilio Call SID:", call.sid);
    res.json({ success: true, sid: call.sid });
  } catch (err) {
    console.error("\u274C Twilio error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5001, () => console.log("Test API running on 5001"));
