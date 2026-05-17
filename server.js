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
  .then(() => console.log('✅ Uspešno povezan sa MongoDB bazoм!'))
  .catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

// --- MONGODB ŠEME ---

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

// FIKS: Ovo sada šalje tvoj prelepi index.html direktno na ekran čim otvoriš link!
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Povlačenje svih podataka pri paljenju aplikacije
app.get('/api/podaci', async (req, res) => {
    try {
        let kat = await Kategorije.findOne();
        if(!kat) kat = await Kategorije.create({});
        const ucenici = await Ucenik.find();
        const casovi = await Cas.find();
        res.json({ kat, ucenici, casovi });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// Čuvanje i ažuriranje sistemskih kategorija iz admin panela
app.post('/api/kategorije', async (req, res) => {
    try {
        let kat = await Kategorije.findOne();
        if(!kat) kat = new Kategorije();
        kat.ocene = req.body.ocene;
        kat.vladanje = req.body.vladanje;
        kat.aktivnosti = req.body.aktivnosti;
        await kat.save();
        res.json(kat);
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// Časovi: Upis novog održanog časa
app.post('/api/casovi', async (req, res) => {
    try { 
        const nov = await Cas.create(req.body); 
        res.status(200).json(nov); 
    } catch (err) { 
        res.status(400).json(err); 
    }
});

// Časovi: Izmena časa
app.put('/api/casovi/:id', async (req, res) => {
    try { 
        const azur = await Cas.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        res.json(azur); 
    } catch (err) { 
        res.status(400).json(err); 
    }
});

// Časovi: Brisanje časa
app.delete('/api/casovi/:id', async (req, res) => {
    try { 
        await Cas.findByIdAndDelete(req.params.id); 
        res.json({ m: "Čas obrisan" }); 
    } catch (err) { 
        res.status(400).json(err); 
    }
});

// Učenici: Dodavanje novog učenika u bazu podataka
app.post('/api/ucenici', async (req, res) => {
    try { 
        const nov = await Ucenik.create(req.body); 
        res.status(200).json(nov); 
    } catch (err) { 
        res.status(400).json(err); 
    }
});

// Učenici: Upis ocena, izostanaka, vladanja i aktivnosti
app.put('/api/ucenici/:id', async (req, res) => {
    try { 
        const azur = await Ucenik.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        res.json(azur); 
    } catch (err) { 
        res.status(400).json(err); 
    }
});

// Učenici: Brisanje đaka iz baze podataka
app.delete('/api/ucenici/:id', async (req, res) => {
    try { 
        await Ucenik.findByIdAndDelete(req.params.id); 
        res.json({ m: "Učenik obrisan" }); 
    } catch (err) { 
        res.status(400).json(err); 
    }
});

app.listen(PORT, () => console.log(`🚀 Server radi i sluša na portu ${PORT}`));
