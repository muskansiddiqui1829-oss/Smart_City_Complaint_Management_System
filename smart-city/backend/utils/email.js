import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
};

const templates = {
  emailVerification: ({ name, verifyUrl }) => ({
    subject: 'Verify Your Email - Smart City Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🏙️ Smart City Platform</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e40af;">Welcome, ${name}!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #1e40af; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
      </div>
    `,
  }),

  passwordReset: ({ name, resetUrl }) => ({
    subject: 'Password Reset - Smart City Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🏙️ Smart City Platform</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e40af;">Password Reset Request</h2>
          <p>Hi ${name}, we received a request to reset your password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  }),

  complaintSubmitted: ({ name, complaintId, title, category, dashboardUrl }) => ({
    subject: `Complaint Received - ${complaintId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🏙️ Smart City Platform</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #059669;">✅ Complaint Submitted</h2>
          <p>Dear ${name},</p>
          <p>Your complaint has been received and is being reviewed.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p><strong>Tracking ID:</strong> ${complaintId}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Status:</strong> Pending</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${dashboardUrl}" style="background: #1e40af; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">Track Complaint</a>
          </div>
        </div>
      </div>
    `,
  }),

  statusUpdate: ({ name, complaintId, title, previousStatus, newStatus, comment, dashboardUrl }) => ({
    subject: `Complaint Update - ${complaintId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🏙️ Smart City Platform</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e40af;">Complaint Status Updated</h2>
          <p>Dear ${name},</p>
          <p>Your complaint status has been updated.</p>
          <div style="background: #eff6ff; border-left: 4px solid #1e40af; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p><strong>Complaint:</strong> ${complaintId} - ${title}</p>
            <p><strong>Previous Status:</strong> ${previousStatus}</p>
            <p><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatus}</span></p>
            ${comment ? `<p><strong>Message:</strong> ${comment}</p>` : ''}
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${dashboardUrl}" style="background: #1e40af; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">View Details</a>
          </div>
        </div>
      </div>
    `,
  }),
};

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    const { html } = templates[template](data);

    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error(`Email failed to ${to}: ${error.message}`);
    throw error;
  }
};
