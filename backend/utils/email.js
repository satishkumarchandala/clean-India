import nodemailer from 'nodemailer';
import config from '../config/config.js';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

// Send email function
export const sendEmail = async (to, subject, html) => {
  try {
    if (!config.email.user || !config.email.pass) {
      console.log('Email credentials not configured. Skipping email send.');
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Urban Issue Reporter" <${config.email.user}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    throw error;
  }
};

// Email templates
export const generateWelcomeEmail = (userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏙 Welcome to Urban Issue Reporter!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Thank you for joining Urban Issue Reporter! We're excited to have you as part of our community working together to make our cities better.</p>
          <p>With your account, you can:</p>
          <ul>
            <li>📍 Report urban issues in your area</li>
            <li>🗺️ View issues on an interactive map</li>
            <li>💬 Engage with the community through comments</li>
            <li>📊 Track the status of your reports</li>
          </ul>
          <p>Get started by completing your profile and reporting your first issue!</p>
          <p>Best regards,<br>The Urban Issue Reporter Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Urban Issue Reporter. Making cities better, together.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateIssueReportEmail = (userName, issueTitle, category, issueId) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .issue-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Issue Reported Successfully!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your issue has been successfully reported and is now under review.</p>
          <div class="issue-box">
            <h3>${issueTitle}</h3>
            <p><strong>Category:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
            <p><strong>Issue ID:</strong> #${issueId}</p>
          </div>
          <p>You will receive email notifications when there are updates on your issue.</p>
          <p>Thank you for helping improve our community!</p>
          <p>Best regards,<br>The Urban Issue Reporter Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Urban Issue Reporter. Making cities better, together.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateStatusUpdateEmail = (userName, issueTitle, status, comment, issueId) => {
  const statusMessages = {
    'pending': '⏳ Your issue is pending review',
    'in-progress': '🔄 Work has started on your issue',
    'resolved': '✅ Your issue has been resolved',
    'rejected': '❌ Your issue has been rejected',
  };

  const statusColors = {
    'pending': '#ffa500',
    'in-progress': '#3498db',
    'resolved': '#2ecc71',
    'rejected': '#e74c3c',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid ${statusColors[status]}; border-radius: 5px; }
        .comment-box { background: #e8f4f8; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Status Update</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>There's an update on your reported issue:</p>
          <div class="status-box">
            <h3>${issueTitle}</h3>
            <p><strong>Issue ID:</strong> #${issueId}</p>
            <p><strong>New Status:</strong> <span style="color: ${statusColors[status]}; font-weight: bold;">${statusMessages[status]}</span></p>
          </div>
          ${comment ? `
          <div class="comment-box">
            <p><strong>Admin Comment:</strong></p>
            <p>${comment}</p>
          </div>
          ` : ''}
          <p>Thank you for your patience and for helping improve our community!</p>
          <p>Best regards,<br>The Urban Issue Reporter Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Urban Issue Reporter. Making cities better, together.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateCommentEmail = (userName, issueTitle, commenterName, comment, issueId) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .comment-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Comment</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>There's a new comment on your issue:</p>
          <div class="comment-box">
            <h3>${issueTitle}</h3>
            <p><strong>Issue ID:</strong> #${issueId}</p>
            <p><strong>Comment by:</strong> ${commenterName}</p>
            <p>${comment}</p>
          </div>
          <p>Best regards,<br>The Urban Issue Reporter Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Urban Issue Reporter. Making cities better, together.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
