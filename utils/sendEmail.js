import { createTransport } from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  // nodemailer setup
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.AUTH_EMAIL,
    to,
    subject,
    text,
  });
};
