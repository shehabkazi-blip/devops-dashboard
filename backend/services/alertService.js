const axios = require('axios');
const nodemailer = require('nodemailer');
const Alert = require('../models/Alert');

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function sendDiscordAlert(message) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return false;
  try {
    await axios.post(webhook, { content: message });
    return true;
  } catch (err) {
    console.error('[alert] discord webhook failed:', err.message);
    return false;
  }
}

async function sendEmailAlert(subject, message) {
  const transporter = getTransporter();
  const to = process.env.ALERT_EMAIL_TO;
  if (!transporter || !to) return false;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text: message
    });
    return true;
  } catch (err) {
    console.error('[alert] email send failed:', err.message);
    return false;
  }
}

/**
 * Fires a "System Down" or "Recovered" alert across all configured channels
 * and persists a record of it so the dashboard can show an alert feed.
 */
async function fireAlert({ repo, type, message }) {
  const channels = [];

  const discordMsg =
    type === 'down'
      ? `🔴 **System Down** — ${repo.name}\n${message}\nURL: ${repo.healthCheckUrl}`
      : `🟢 **Recovered** — ${repo.name}\n${message}\nURL: ${repo.healthCheckUrl}`;

  if (await sendDiscordAlert(discordMsg)) channels.push('discord');
  if (await sendEmailAlert(`[Dashboard] ${type === 'down' ? 'System Down' : 'Recovered'}: ${repo.name}`, message))
    channels.push('email');

  const alert = await Alert.create({
    repo: repo._id,
    type,
    message,
    channels
  });

  return alert;
}

module.exports = { fireAlert };
