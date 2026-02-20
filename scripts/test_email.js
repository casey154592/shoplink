require('dotenv').config();
const nodemailer = require('nodemailer');

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

if (!user || !pass) {
  console.error('Set EMAIL_USER and EMAIL_PASS in .env (use an App Password).');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass }
});

const mailOptions = {
  from: user,
  to: user,
  subject: 'Shoplink test email',
  text: 'This is a test email from shoplink.'
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('Send failed:', err);
    process.exit(1);
  }
  console.log('Message sent:', info.response || info);
});
