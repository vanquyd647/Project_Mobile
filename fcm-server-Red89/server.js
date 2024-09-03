const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const serviceAccount = require('./red89-f8933-firebase-adminsdk-wt9jo-eb80ac9fa5.json'); // Cập nhật đường dẫn đến tệp tài khoản dịch vụ của bạn

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

let notificationHistory = [];

app.post('/send-notification', (req, res) => {
    const { token, title, body } = req.body;

    const message = {
        notification: {
            title: title,
            body: body,
        },
        token: token,
    };

    admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message:', response);

            notificationHistory.push({ token, title, body, timestamp: new Date() });

            res.status(200).send('Notification sent successfully');
        })
        .catch((error) => {
            console.log('Error sending message:', error);
            res.status(500).send('Error sending notification');
        });
});

app.get('/notification-history', (req, res) => {
    res.status(200).json(notificationHistory);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
