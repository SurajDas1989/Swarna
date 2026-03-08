require('dotenv').config();
const nodemailer = require('nodemailer');

// Configure Hostinger SMTP transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

async function testEmail() {
    console.log('Attempting to authenticate with SMTP Hostinger...');
    console.log('User:', process.env.SMTP_USER);

    // Verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.error('SMTP Connection Error:', error);
        } else {
            console.log('Server is ready to take our messages. Connection Successful!');

            // Send a test email
            const mailOptions = {
                from: `"Swarna Collection" <${process.env.SMTP_USER}>`,
                to: 'msuraj2001@gmail.com', // Putting your email directly here to test
                subject: 'Test Email from Swarna Collection App',
                html: '<p>Hello!</p><p>This is a test email confirming that your Hostinger SMTP credentials are working correctly.</p>',
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                } else {
                    console.log('Message sent successfully! ID:', info.messageId);
                }
            });
        }
    });
}

testEmail();
