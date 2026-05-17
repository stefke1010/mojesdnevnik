const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Povezivanje sa MongoDB bazom
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ednevnik';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Uspešno povezan sa MongoDB bazom!'))
  .catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

// --- MONGODB ŠEME ---

const PredmetSchema = new mongoose.Schema({
    id: String,      
    naziv: String    
});
const Predmet = mongoose.model('Predmet', PredmetSchema);

const OdeljenjeSchema = new mongoose.Schema({
    naziv: String    
});
const Odeljenje = mongoose.model('Odeljenje', OdeljenjeSchema);

const NastavnikSchema = new mongoose.Schema({
    ime: String,
    uloga: String,
    username: String,
    password: { type: String, default: "admin123" }, // Lozinka koja se menja i čuva
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
        const ucenici = await Ucenik.find();
        const casovi = await Cas.find();
        const nastavnici = await Nastavnik.find();
        const predmeti = await Predmet.find();
        const odeljenja = await Odeljenje.find();
        res.json({ ucenici, casovi, nastavnici, predmeti, odeljenja });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// NOVA RUTA: Promena lozinke za admina ili nastavnika u bazi
app.post('/api/nastavnici/promena-lozinke', async (req, res) => {
    try {
        const { username, novaLozinka } = req.body;
        // Ako menjaš fabričkog admina koji još nema profil u nizu, kreiraćemo ga automatski
        let korisnik = await Nastavnik.findOne({ username: username });
        if (!korisnik && username === 'admin') {
            korisnik = new Nastavnik({ ime: "Стефан Михајловић", uloga: "Администратор", username: "admin" });
        }
        if (korisnik) {
            korisnik.password = novaLozinka;
            await korisnik.save();
            return res.json({ success: true, message: "Лозинка је успешно сачувана у бази!" });
        }
        res.status(444).json({ success: false, message: "Корисник није пронађен!" });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Predmeti
app.post('/api/predmeti', async (req, res) => {
    try { const nov = await Predmet.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/predmeti/:id', async (req, res) => {
    try { await Predmet.deleteOne({ id: req.params.id }); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

// Odeljenja
app.post('/api/odeljenja', async (req, res) => {
    try { const nov = await Odeljenje.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/odeljenja/:naziv', async (req, res) => {
    try { await Odeljenje.deleteOne({ naziv: req.params.naziv }); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

// Nastavnici generalno
app.post('/api/nastavnici', async (req, res) => {
    try { const nov = await Nastavnik.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/nastavnici/:id', async (req, res) => {
    try { await Nastavnik.findByIdAndDelete(req.params.id); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

// Časovi
app.post('/api/casovi', async (req, res) => {
    try { const nov = await Cas.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.put('/api/casovi/:id', async (req, res) => {
    try { const azur = await Cas.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/casovi/:id', async (req, res) => {
    try { await Cas.findByIdAndDelete(req.params.id); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

// Učenici
app.post('/api/ucenici', async (req, res) => {
    try { const nov = await Ucenik.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.put('/api/ucenici/:id', async (req, res) => {
    try { const azur = await Ucenik.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/ucenici/:id', async (req, res) => {
    try { await Ucenik.findByIdAndDelete(req.params.id); res.json({ message: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

app.listen(PORT, () => console.log(`🚀 Server radi na portu ${PORT}`));
