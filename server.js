const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Povezivanje sa MongoDB (Zameni link tvojim MongoDB Atlas linkom ako radiš deploy na Render)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ednevnik';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Povezan sa MongoDB bazoм!'))
  .catch(err => console.error('❌ Greška sa bazom:', err));

// --- MONGODB ŠEME ---

// Šema za sistemske kategorije
const KatSchema = new mongoose.Schema({
    ocene: { type: [String], default: ["Усмена провера", "Писмени задатак", "Активност"] },
    vladanje: { type: [String], default: ["Недисциплина", "Ометање наставе", "Заборављен прибор"] },
    aktivnosti: { type: [String], default: ["Рад на часу", "Залагање", "Домаћи задатак"] }
});
const Kategorije = mongoose.model('Kategorije', KatSchema);

// Šema za održane časove
const CasSchema = new mongoose.Schema({
    lekcija: String,
    rbr: String,
    tip: String,
    odeljenje: String,
    predmetId: String,
    datum: String
});
const Cas = mongoose.model('Cas', CasSchema);

// Šema za učenike
const UcenikSchema = new mongoose.Schema({
    ime: String,
    odeljenje: String,
    ocene: [{ vrednost: Number, vrsta: String, predmet: String, datum: String }],
    izostanci: [{ lekcija: String, predmet: String, datum: String, status: String, beleska: String }],
    vladanje_lista: [{ tip: String, vrsta: String, tekst: String, datum: String }],
    aktivnosti: [{ znak: String, vrsta: String, tekst: String, datum: String }]
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);

// --- API RUTE (ENDPOINTS) ---

// Inicijalno povlačenje svih podataka pri paljenju bilo kog browsera
app.get('/api/podaci', async (req, res) => {
    try {
        let kat = await Kategorije.findOne();
        if(!kat) kat = await Kategorije.create({});
        const ucenici = await Ucenik.find();
        const casovi = await Cas.find();
        res.json({ kat, ucenici, casovi });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Čuvanje naziva kategorija iz administracije
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

// Časovi: Upis, Izmena, Brisanje
app.post('/api/casovi', async (req, res) => {
    try { const nov = await Cas.create(req.body); res.status(210).json(nov); } catch (err) { res.status(400).json(err); }
});
app.put('/api/casovi/:id', async (req, res) => {
    try { const azur = await Cas.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/casovi/:id', async (req, res) => {
    try { await Cas.findByIdAndDelete(req.params.id); res.json({ m: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

// Učenici: Upis, Izmena (ocene, vladanje, izostanci, aktivnosti), Brisanje
app.post('/api/ucenici', async (req, res) => {
    try { const nov = await Ucenik.create(req.body); res.status(201).json(nov); } catch (err) { res.status(400).json(err); }
});
app.put('/api/ucenici/:id', async (req, res) => {
    try { const azur = await Ucenik.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(azur); } catch (err) { res.status(400).json(err); }
});
app.delete('/api/ucenici/:id', async (req, res) => {
    try { await Ucenik.findByIdAndDelete(req.params.id); res.json({ m: "Obrisano" }); } catch (err) { res.status(400).json(err); }
});

app.listen(PORT, () => console.log(`🚀 Server radi na portu ${PORT}`));
