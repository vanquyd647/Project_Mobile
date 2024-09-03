const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Thêm dòng này

// Initialize the Firebase Admin SDK
const serviceAccount = require('./demo1-sub-firebase-adminsdk-4cl3z-b75ec538ed.json'); // Update the path to your service account file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Thêm dòng này

// Endpoint to send notifications
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
            res.status(200).send('Notification sent successfully');
        })
        .catch((error) => {
            console.log('Error sending message:', error);
            res.status(500).send('Error sending notification');
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
