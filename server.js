const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// Render automatski dodeljuje port preko process.env.PORT, ako si lokalno radi na 3000
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE (Omogućava čitanje JSON podataka i komunikaciju)
app.use(cors());
app.use(express.json());

// 2. POVEZIVANJE SA MONGODB BAЗОM
// Ako radiš deploy na Render, u Render postavkama (Environment Variables) dodaj MONGO_URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ednevnik';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Uspešno povezan sa MongoDB bazoм!'))
  .catch(err => console.error('❌ Kritična greška pri povezivanju sa bazom:', err));

// 3. MONGODB ŠEME I MODELI

// Šema za sistemske kategorije (ono što uređuješ u administraciji)
const KatSchema = new mongoose.Schema({
    ocene: { type: [String], default: ["Усмена провера", "Писмени задатак", "Активност"] },
    vladanje: { type: [String], default: ["Недисциплина", "Ометање наставе", "Заборављен прибор"] },
    aktivnosti: { type: [String], default: ["Рад на часу", "Залагање", "Домаћи задатак"] }
});
const Kategorije = mongoose.model('Kategorije', KatSchema);

// Šema za održane časove (za timeline prikaz)
const CasSchema = new mongoose.Schema({
    lekcija: String,
    rbr: String,
    tip: String,
    odeljenje: String,
    predmetId: String,
    datum: String
});
const Cas = mongoose.model('Cas', CasSchema);

// Šema za učenike (sve istorije na jednom mestu, čuvaju se zauvek)
const UcenikSchema = new mongoose.Schema({
    ime: { type: String, required: true },
    odeljenje: { type: String, required: true },
    ocene: [{ id: Number, vrednost: Number, vrsta: String, predmet: String, datum: String }],
    izostanci: [{ lekcija: String, predmet: String, datum: String, status: String, beleska: String }],
    vladanje_lista: [{ id: Number, tip: String, vrsta: String, tekst: String, datum: String }],
    aktivnosti: [{ id: Number, znak: String, vrsta: String, tekst: String, datum: String }]
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);


// 4. RUTIRANJE (API ENDPOINTS)

// --- OVO POPRAVLJA "Cannot GET /" ---
// Kada neko otvori glavnu adresu, server mu odmah servira tvoj interfejs
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Inicijalno povlačenje svih podataka pri paljenju aplikacije
app.get('/api/podaci', async (req, res) => {
    try {
        let kat = await Kategorije.findOne();
        if(!kat) kat = await Kategorije.create({}); // Ako ne postoji, napravi prazan šablon
        
        const ucenici = await Ucenik.find();
        const casovi = await Cas.find();
        
        res.json({ kat, ucenici, casovi });
    } catch (err) { 
        res.status(500).json({ error: 'Greška pri povlačenju podataka iz baze: ' + err.message }); 
    }
});

// Administracija: Čuvanje novih kategorija (za ocene, vladanje i aktivnosti)
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
        res.status(400).json({ error: 'Greška pri čuvanju kategorija: ' + err.message }); 
    }
});

// Časovi: Upis novog održanog časa
app.post('/api/casovi', async (req, res) => {
    try { 
        const noviCas = await Cas.create(req.body); 
        res.status(210).json(noviCas); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// Časovi: Izmena postojećeg časa
app.put('/api/casovi/:id', async (req, res) => {
    try { 
        const azuriranCas = await Cas.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        res.json(azuriranCas); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// Časovi: Brisanje časa iz dnevnika rada
app.delete('/api/casovi/:id', async (req, res) => {
    try { 
        await Cas.findByIdAndDelete(req.params.id); 
        res.json({ poruka: "Čas uspešno obrisan iz baze!" }); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// Učenici: Dodavanje novog đaka u odeljenje iz admin panela
app.post('/api/ucenici', async (req, res) => {
    try { 
        const noviUcenik = await Ucenik.create(req.body); 
        res.status(201).json(noviUcenik); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// Učenici: Glavna izmena (dodavanje ocena, izostanaka, vladanja, aktivnosti u dosije)
app.put('/api/ucenici/:id', async (req, res) => {
    try { 
        const azuriranUcenik = await Ucenik.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        res.json(azuriranUcenik); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// Učenici: Brisanje đaka iz baze podataka za stalno
app.delete('/api/ucenici/:id', async (req, res) => {
    try { 
        await Ucenik.findByIdAndDelete(req.params.id); 
        res.json({ poruka: "Učenik trajno obrisan iz baze!" }); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// 5. POKRETANJE SERVERA
app.listen(PORT, () => {
    console.log(`🚀 eSdnevnik Server uspešno pokrenut!`);
    console.log(`📡 Sluša na adresi: http://localhost:${PORT}`);
});
