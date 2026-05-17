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

// --- MONGODB ŠEME (TRAJNO ČUVANJE ZA SVE ŽIVO) ---

// 1. Šema za registre predmeta (Administracija)
const PredmetSchema = new mongoose.Schema({
    id: String,      // Šifra predmeta (npr. MAT, ENG)
    naziv: String    // Pun naziv predmeta
});
const Predmet = mongoose.model('Predmet', PredmetSchema);

// 2. Šema za profile odeljenja (Administracija)
const OdeljenjeSchema = new mongoose.Schema({
    naziv: String    // Naziv odeljenja (npr. IV-3, VIII-1)
});
const Odeljenje = mongoose.model('Odeljenje', OdeljenjeSchema);

// 3. Šema za nastavnički kadar (Administracija)
const NastavnikSchema = new mongoose.Schema({
    ime: String,
    uloga: String,
    username: String,
    password: String,
    odeljenja: [String],
    predmeti: [String]
});
const Nastavnik = mongoose.model('Nastavnik', NastavnikSchema);

// 4. Šema za upisane časove / dnevnik rada
const CasSchema = new mongoose.Schema({
    lekcija: String,
    rbr: String,
    tip: String,
    odeljenje: String,
    predmetId: String,
    datum: String
});
const Cas = mongoose.model('Cas', CasSchema);

// 5. Šema za učenike (Čuva ocene, aktivnosti, izostanke i sve vrste vladanja/ukora)
const UcenikSchema = new mongoose.Schema({
    ime: String,
    odeljenje: String,
    ocena_vladanja: { type: String, default: "5" }, // Zaključno vladanje (1-5)
    ocene: [{ 
        id: Number, 
        tip: String,        // 'Оцена' или 'Активност'
        vrednost: String,   // Broj '5', '4' ili oznaka '+', '-'
        vrsta: String,      // Kategorija провере / opis aktivnosti
        predmet: String,    // Iz kog predmeta je uneto
        datum: String       // Datum unosa po kome se vrši razvrstavanje po mesecima
    }],
    izostanci: [{ 
        lekcija: String, 
        predmet: String, 
        datum: String, 
        status: { type: String, default: "нерегулисано" } // 'оправдан', 'неоправдан', 'нерегулисано'
    }],
    vladanje_lista: [{ 
        id: Number, 
        vrsta: String,      // 'Напомена', 'Укор direktora', 'Pohvala'..
        tekst: String,      // Veliki textbox tekst sa Enter redovima
        datum: String, 
        predmet: String,    // Pamti se samo za klasičnu Napomenu na času
        cas: String         // Pamti se samo za klasičnu Napomenu na času
    }]
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);


// --- API RUTE (ENDPOINTS) ---

// Frontend ruta
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Glavna ruta koja pri paljenju e-dnevnika povlači apsolutno sve podatke odjednom
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

// --- PREDMETI RUTE ---
app.post('/api/predmeti', async (req, res) => {
    try { const nov = await Predmet.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/predmeti/:id', async (req, res) => {
    try { await Predmet.deleteOne({ id: req.params.id }); res.json({ message: "Predmet obrisan!" }); } catch (err) { res.status(400).json(err); }
});

// --- ODELJENJA RUTE ---
app.post('/api/odeljenja', async (req, res) => {
    try { const nov = await Odeljenje.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/odeljenja/:naziv', async (req, res) => {
    try { await Odeljenje.deleteOne({ naziv: req.params.naziv }); res.json({ message: "Odeljenje obrisano!" }); } catch (err) { res.status(400).json(err); }
});

// --- NASTAVNICI RUTE ---
app.post('/api/nastavnici', async (req, res) => {
    try { const nov = await Nastavnik.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/nastavnici/:id', async (req, res) => {
    try { await Nastavnik.findByIdAndDelete(req.params.id); res.json({ message: "Nastavnički profil obrisan!" }); } catch (err) { res.status(400).json(err); }
});

// --- ČASOVI RUTE ---
app.post('/api/casovi', async (req, res) => {
    try { const nov = await Cas.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.put('/api/casovi/:id', async (req, res) => {
    try { const azur = await Cas.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/casovi/:id', async (req, res) => {
    try { await Cas.findByIdAndDelete(req.params.id); res.json({ message: "Čas obrisan!" }); } catch (err) { res.status(400).json(err); }
});

// --- UČENICI RUTE ---
app.post('/api/ucenici', async (req, res) => {
    try { const nov = await Ucenik.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});
app.put('/api/ucenici/:id', async (req, res) => {
    try { const azur = await Ucenik.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/ucenici/:id', async (req, res) => {
    try { await Ucenik.findByIdAndDelete(req.params.id); res.json({ message: "Učenik obrisan!" }); } catch (err) { res.status(400).json(err); }
});

app.listen(PORT, () => console.log(`🚀 Moćni i kompletni server radi cakum-pakum na portu ${PORT}`));
