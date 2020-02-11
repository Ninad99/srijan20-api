const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('./srijan20-admin.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const baseURL = 'https://us-central1-srijan20-temp.cloudfunctions.net/app';

app.use(cors());
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', 'views');
app.set('view engine', 'ejs');


app.get('/', (req, res, next) => {
  res.send('<html><head></head><body><h2>Server running!</h2></body></html>');
});

module.exports = {
  firestore: admin.firestore(),
  baseURL: baseURL
}

const merchandiseRoutes = require('./routes/merchandise');
const workshopsRoutes = require('./routes/workshops');
app.use('/merch', merchandiseRoutes);
app.use('/workshops', workshopsRoutes);

app.listen(process.env.PORT || 2000, () => console.log(`server running on port ${process.env.PORT ? process.env.PORT : 2000}`));