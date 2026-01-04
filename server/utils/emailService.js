const nodemailer = require("nodemailer");

/**
 * Create an email transporter based on environment variables
 */
const createEmailTransporter = async () => {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (emailService === 'Outlook365' || emailService === 'Office365') {
        return nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });
    } else {
        // Default service configurator (Gmail, etc.)
        return nodemailer.createTransport({
            service: emailService,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
};

module.exports = {
    createEmailTransporter
};
