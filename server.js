const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Povezivanje sa MongoDB bazom (Zadržava tvoj link na Renderu)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ednevnik';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Uspešno povezan sa MongoDB bazom!'))
  .catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

// --- MONGODB ŠEME ---

const SkolaSchema = new mongoose.Schema({
    naziv: { type: String, default: "ОС Основна Школа" }
});
const Skola = mongoose.model('Skola', SkolaSchema);

const NastavnikSchema = new mongoose.Schema({
    ime: String,
    uloga: String,
    username: String,
    password: String,
    odeljenja: [String],
    predmeti: [String]
});
const Nastavnik = mongoose.model('Nastavnik', NastavnikSchema);

const CasSchema = new mongoose.Schema({
    lekcija: String,
    rbr: String,
    tip: String,
    odeljenje: String,
    predmetId: String,
    datum: String
});
const Cas = mongoose.model('Cas', CasSchema);

const UcenikSchema = new mongoose.Schema({
    ime: String,
    odeljenje: String,
    ocena_vladanja: { type: String, default: "5" },
    ocene: [{ 
        id: Number, 
        tip: String,        
        vrednost: String,   
        vrsta: String,      
        predmet: String, 
        datum: String 
    }],
    izostanci: [{ 
        lekcija: String, 
        predmet: String, 
        datum: String, 
        status: { type: String, default: "нерегулисано" }
    }],
    vladanje_lista: [{ 
        id: Number, 
        vrsta: String,      
        tekst: String,      
        datum: String, 
        predmet: String,    
        cas: String         
    }]
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);

// --- API RUTE ---

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/podaci', async (req, res) => {
    try {
        let skolaInfo = await Skola.findOne();
        if(!skolaInfo) skolaInfo = await Skola.create({});
        const ucenici = await Ucenik.find();
        const casovi = await Cas.find();
        const nastavnici = await Nastavnik.find();
        res.json({ ucenici, casovi, skola: skolaInfo, nastavnici });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/skola', async (req, res) => {
    try {
        let skolaInfo = await Skola.findOne();
        if(!skolaInfo) skolaInfo = new Skola();
        skolaInfo.naziv = req.body.naziv;
        await skolaInfo.save();
        res.json(skolaInfo);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/nastavnici', async (req, res) => {
    try { const nov = await Nastavnik.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});

app.delete('/api/nastavnici/:id', async (req, res) => {
    try { await Nastavnik.findByIdAndDelete(req.params.id); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

app.post('/api/casovi', async (req, res) => {
    try { const nov = await Cas.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});

app.put('/api/casovi/:id', async (req, res) => {
    try { const azur = await Cas.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});

app.delete('/api/casovi/:id', async (req, res) => {
    try { await Cas.findByIdAndDelete(req.params.id); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

app.post('/api/ucenici', async (req, res) => {
    try { const nov = await Ucenik.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});

app.put('/api/ucenici/:id', async (req, res) => {
    try { const azur = await Ucenik.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});

app.delete('/api/ucenici/:id', async (req, res) => {
    try { await Ucenik.findByIdAndDelete(req.params.id); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

app.listen(PORT, () => console.log(`🚀 Moćni server radi cakum-pakum na portu ${PORT}`));
