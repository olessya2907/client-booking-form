const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// Настройка загрузки файлов
const upload = multer({ dest: 'uploads/' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'olesya2907@gmail.com',
        pass: 'tefr dfzp wmqz vjiz'
    }
});

app.post('/api/submit', upload.single('file'), async (req, res) => {
    const { name, email, phone } = req.body;
    const uploadedFile = req.file;
    
    try {
        const attachments = [];
        
        // Добавляем только загруженный файл клиента (если есть)
        if (uploadedFile) {
            attachments.push({
                filename: uploadedFile.originalname,
                path: uploadedFile.path
            });
        }
        
        const mailOptions = {
            from: 'olesya2907@gmail.com',
            to: ['olesya2907@gmail.com'],
            subject: 'New Client Request',
            html: `
                <h2>New Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString('en-US')}</p>
                ${uploadedFile ? `<p><strong>Attached file:</strong> ${uploadedFile.originalname}</p>` : '<p><em>No file attached</em></p>'}
            `,
            attachments: attachments
        };
        
        await transporter.sendMail(mailOptions);
        
        // Удаляем временный файл
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
