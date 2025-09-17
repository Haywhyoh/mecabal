const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConnection() {
  console.log('Testing email service configuration...');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_HOST_USER:', process.env.EMAIL_HOST_USER);
  console.log('EMAIL_SENDER:', process.env.EMAIL_SENDER);
  console.log('CLIENT_URL:', process.env.CLIENT_URL);

  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

  try {
    console.log('Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email service connection verified successfully!');
    
    // Test sending an email
    console.log('Testing email send...');
    const result = await transporter.sendMail({
      from: `MeCabal Community <${process.env.EMAIL_SENDER}>`,
      to: 'test@example.com',
      subject: 'Test Email from MeCabal',
      html: '<h1>Test Email</h1><p>This is a test email from MeCabal.</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmailConnection();

