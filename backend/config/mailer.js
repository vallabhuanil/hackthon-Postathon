
import nodemailer from "nodemailer";
import axios from "axios";

export const sendEmail = async (to, subject, html) => {
  
  const apiKey = process.env.BREVO_API_KEY;

  
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: "India Post", email: process.env.BREVO_MAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
      }
    );
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email Failed:", error.response ? error.response.data : error.message);
  }
};