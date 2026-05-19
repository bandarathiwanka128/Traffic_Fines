const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',  require('./src/routes/auth'));
app.use('/api/fines', require('./src/routes/fines'));
app.use('/api/users', require('./src/routes/users'));

app.get('/', (req, res) => res.json({ message: 'Traffic Fine API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
