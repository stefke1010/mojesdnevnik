const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Povezivanje sa MongoDB bazom (Render koristi tvoj MONGO_URI iz okruženja)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ednevnik';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Uspešno povezan sa MongoDB bazom!'))
  .catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

// --- MONGODB ŠEME ---

// Novo: Šema za podešavanja škole (Naziv ustanove)
const SkolaSchema = new mongoose.Schema({
    naziv: { type: String, default: "ОС Основна Школа" }
});
const Skola = mongoose.model('Skola', SkolaSchema);

// Novo: Šema za nastavnike
const NastavnikSchema = new mongoose.Schema({
    ime: String,
    uloga: String,
    username: String,
    password: String,
    odeljenja: [String],
    predmeti: [String]
});
const Nastavnik = mongoose.model('Nastavnik', NastavnikSchema);

const KatSchema = new mongoose.Schema({
    ocene: { type: [String], default: ["Усмена провера", "Писмени задатак", "Активност"] },
    vladanje: { type: [String], default: ["Недисциплина", "Ометање наставе", "Заборављен прибор"] },
    aktivnosti: { type: [String], default: ["Рад на часу", "Залагање", "Домаћи задатак"] }
});
const Kategorije = mongoose.model('Kategorije', KatSchema);

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
    ocene: [{ id: Number, vrednost: Number, vrsta: String, predmet: String, datum: String }],
    izostanci: [{ lekcija: String, predmet: String, datum: String, status: String, beleska: String }],
    vladanje_lista: [{ id: Number, tip: String, vrsta: String, tekst: String, datum: String }],
    aktivnosti: [{ id: Number, znak: String, vrsta: String, tekst: String, datum: String }]
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);

// --- API RUTE (ENDPOINTS) ---

// Šalje index.html na ekran
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Povlačenje SVIH podataka pri paljenju aplikacije (Sada vuče i školu i nastavnike)
app.get('/api/podaci', async (req, res) => {
    try {
        let kat = await Kategorije.findOne();
        if(!kat) kat = await Kategorije.create({});
        
        let skolaInfo = await Skola.findOne();
        if(!skolaInfo) skolaInfo = await Skola.create({});

        const ucenici = await Ucenik.find();
        const casovi = await Cas.find();
        const nastavnici = await Nastavnik.find();

        res.json({ kat, ucenici, casovi, skola: skolaInfo, nastavnici });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// Novo: Čuvanje i ažuriranje naziva škole
app.post('/api/skola', async (req, res) => {
    try {
        let skolaInfo = await Skola.findOne();
        if(!skolaInfo) skolaInfo = new Skola();
        skolaInfo.naziv = req.body.naziv;
        await skolaInfo.save();
        res.json(skolaInfo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Novo: Kreiranje novog nastavničkog profila
app.post('/api/nastavnici', async (req, res) => {
    try {
        const nov = await Nastavnik.create(req.body);
        res.status(200).json(nov);
    } catch (err) {
        res.status(400).json(err);
    }
});

// Novo: Brisanje nastavničkog profila
app.delete('/api/nastavnici/:id', async (req, res) => {
    try {
        await Nastavnik.findByIdAndDelete(req.params.id);
        res.json({ m: "Nastavnik obrisan" });
    } catch (err) {
        res.status(400).json(err);
    }
});

// Kategorije
app.post('/api/kategorije', async (req, res) => {
    try {
        let kat = await Kategorije.findOne();
        if(!kat) kat = new Kategorije();
        kat.ocene = req.body.ocene;
        kat.vladanje = req.body.vladanje;
        kat.aktivnosti = req.body.aktivnosti;
        await kat.save();
        res.json(kat);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Časovi: Upis
app.post('/api/casovi', async (req, res) => {
    try { const nov = await Cas.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});

// Časovi: Izmena
app.put('/api/casovi/:id', async (req, res) => {
    try { const azur = await Cas.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});

// Časovi: Brisanje
app.delete('/api/casovi/:id', async (req, res) => {
    try { await Cas.findByIdAndDelete(req.params.id); res.json({ m: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

// Učenici: Unos
app.post('/api/ucenici', async (req, res) => {
    try { const nov = await Ucenik.create(req.body); res.status(200).json(nov); } catch (err) { res.status(400).json(err); }
});

// Učenici: Ažuriranje (Ocene, aktivnosti, izostanci...)
app.put('/api/ucenici/:id', async (req, res) => {
    try { const azur = await Ucenik.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});

// Učenici: Brisanje
app.delete('/api/ucenici/:id', async (req, res) => {
    try { await Ucenik.findByIdAndDelete(req.params.id); res.json({ m: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

app.listen(PORT, () => console.log(`🚀 Server radi i sluša na portu ${PORT}`));
