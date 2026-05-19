const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

// 1. POVEZIVANJE SA BAZOM (Zameni sa svojom MongoDB Atlas adresom)
const dbURI = 'mongodb://localhost:27017/eSDnevnik'; 
mongoose.connect(dbURI)
  .then(() => console.log('Povezano sa MongoDB bazom!'))
  .catch(err => console.log(err));

// 2. MODELI PODATAKA
const UcenikSchema = new mongoose.Schema({
    ime: String,
    odeljenje: String,
    ocene: Array,
    izostanci: Array,
    aktivnosti: Array
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);

// 3. API RUTE
// Učitaj sve učenike
app.get('/api/ucenici', async (req, res) => {
    const ucenici = await Ucenik.find();
    res.json(ucenici);
});

// Dodaj novu ocenu (primer)
app.post('/api/dodaj-ocenu', async (req, res) => {
    const { ucenikId, ocena, predmet } = req.body;
    await Ucenik.findByIdAndUpdate(ucenikId, { 
        $push: { ocene: { ocena, predmet, datum: new Date() } } 
    });
    res.send({ status: 'Sačuvano' });
});

// 4. POSLUŽIVANJE HTML-a
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => console.log('Server radi na http://localhost:3000'));
