require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('.'));

const upload = multer({ dest: 'uploads/' });

// AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// AWS SES via SMTP (Nodemailer)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    }
});

app.post('/api/submit', upload.single('file'), async (req, res) => {
    const { name, email, phone } = req.body;
    const uploadedFile = req.file;
    
    try {
        const attachments = [];
        let s3FileUrl = null;
        
        // Upload file to S3 if provided
        if (uploadedFile) {
            const fileContent = fs.readFileSync(uploadedFile.path);
            const fileName = `${Date.now()}-${uploadedFile.originalname}`;
            
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileName,
                Body: fileContent,
                ContentType: uploadedFile.mimetype
            };
            
            await s3Client.send(new PutObjectCommand(uploadParams));
            
            s3FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
            
            // Also attach file to email
            attachments.push({
                filename: uploadedFile.originalname,
                path: uploadedFile.path
            });
        }
        
        // Send email via AWS SES
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_TO.split(','),
            subject: 'New Client Request',
            html: `
                <h2>New Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString('en-US')}</p>
                ${uploadedFile ? `<p><strong>Attached file:</strong> ${uploadedFile.originalname}</p>` : '<p><em>No file attached</em></p>'}
                ${s3FileUrl ? `<p><strong>S3 File URL:</strong> <a href="${s3FileUrl}">${s3FileUrl}</a></p>` : ''}
            `,
            attachments: attachments
        };
        
        await transporter.sendMail(mailOptions);
        
        // Clean up temporary file
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path);
        }
        
        res.json({ success: true, message: 'Request submitted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
