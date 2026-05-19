const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔌 POVEZIVANJE NA MONGO DB
const MONGO_URI = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/esdnevnik'; 

mongoose.connect(MONGO_URI)
    .then(() => console.log('🔄 Uspješno povezan na MongoDB!'))
    .catch(err => console.error('❌ Greška pri povezivanju na MongoDB:', err));

// ==================== MONGOOSE SHEME I MODELI ====================

// 1. Model za Predmete
const PredmetSchema = new mongoose.Schema({
    naziv: { type: String, required: true, unique: true }
});
const Predmet = mongoose.model('Predmet', PredmetSchema);

// 2. Model za Profesore (Profile za dnevnik)
const ProfesorSchema = new mongoose.Schema({
    imePrezime: { type: String, required: true },
    titula: { type: String, default: 'Profesor' }
});
const Profesor = mongoose.model('Profesor', ProfesorSchema);

// 3. Model za Odeljenja
const OdeljenjeSchema = new mongoose.Schema({
    oznaka: { type: String, required: true },
    razred: { type: String, required: true },
    smer: { type: String, required: true },
    staresinaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profesor' }
});
const Odeljenje = mongoose.model('Odeljenje', OdeljenjeSchema);

// 4. Podshema za Izostanke
const IzostanakSchema = new mongoose.Schema({
    cas: { type: Number, required: true },
    status: { type: String, default: 'Neopravdano' },
    datum: { type: String, required: true },
    predmetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Predmet' }
});

// 5. Model za Učenike
const UcenikSchema = new mongoose.Schema({
    odeljenjeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Odeljenje', required: true },
    imePrezime: { type: String, required: true },
    ocene: [{ type: Number }],
    vladanje: { type: String, default: 'Primerno (5)' },
    aktivnosti: { type: String, default: '' },
    izostanci: [IzostanakSchema]
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);

// 6. Model za Časove
const CasSchema = new mongoose.Schema({
    odeljenjeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Odeljenje', required: true },
    profesorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profesor', required: true },
    predmetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Predmet', required: true },
    brCasa: { type: Number, required: true },
    opisCasa: { type: String, required: true },
    datum: { type: String, required: true }
});
const Cas = mongoose.model('Cas', CasSchema);


// ==================== API RUTE ====================

// 📌 RUTE ZA PREDMETE
app.get('/api/predmeti', async (req, res) => {
    try {
        const predmeti = await Predmet.find();
        res.json(predmeti.map(p => ({ id: p._id, naziv: p.naziv })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/predmeti', async (req, res) => {
    try {
        const { naziv } = req.body;
        const noviPredmet = new Predmet({ naziv });
        await noviPredmet.save();
        res.status(201).json({ id: noviPredmet._id, naziv });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 📌 RUTE ZA PROFESORE (PROFILE)
app.get('/api/profesori', async (req, res) => {
    try {
        const profesori = await Profesor.find();
        res.json(profesori.map(p => ({ id: p._id, imePrezime: p.imePrezime, titula: p.titula })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/profesori', async (req, res) => {
    try {
        const { imePrezime, titula } = req.body;
        const noviProfesor = new Profesor({ imePrezime, titula });
        await noviProfesor.save();
        res.status(201).json({ id: noviProfesor._id, imePrezime, titula });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 📌 RUTE ZA ODELJENJA
app.get('/api/odeljenja', async (req, res) => {
    try {
        const odeljenja = await Odeljenje.find().populate('staresinaId');
        res.json(odeljenja.map(o => ({ 
            id: o._id, 
            oznaka: o.oznaka, 
            razred: o.razred, 
            smer: o.smer, 
            staresina: o.staresinaId ? o.staresinaId.imePrezime : 'Nema starešine'
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/odeljenja', async (req, res) => {
    try {
        const { oznaka, razred, smer, staresinaId } = req.body;
        const novoOdeljenje = new Odeljenje({ oznaka, razred, smer, staresinaId: staresinaId || null });
        await novoOdeljenje.save();
        res.status(201).json(novoOdeljenje);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 📌 RUTE ZA UČENIKE
app.get('/api/ucenici', async (req, res) => {
    try {
        const { odeljenjeId } = req.query;
        let filter = {};
        if (odeljenjeId) filter.odeljenjeId = odeljenjeId;
        
        const ucenici = await Ucenik.find(filter);
        res.json(ucenici.map(u => ({
            id: u._id,
            odeljenjeId: u.odeljenjeId,
            imePrezime: u.imePrezime,
            ocene: u.ocene,
            vladanje: u.vladanje,
            aktivnosti: u.aktivnosti,
            izostanci: u.izostanci
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ucenici', async (req, res) => {
    try {
        const { odeljenjeId, imePrezime } = req.body;
        const noviUcenik = new Ucenik({ odeljenjeId, imePrezime, ocene: [], izostanci: [] });
        await noviUcenik.save();
        res.status(201).json(noviUcenik);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/ucenici/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ocene, vladanje, aktivnosti } = req.body;
        let updateData = {};
        if (ocene) updateData.ocene = ocene;
        if (vladanje) updateData.vladanje = vladanje;
        if (aktivnosti) updateData.aktivnosti = aktivnosti;

        const ucenik = await Ucenik.findByIdAndUpdate(id, updateData, { new: true });
        res.json(ucenik);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 📌 UPISIVANJE ČASA I AUTOMATSKO DODAVANJE IZOSTANAKA VEZANIH ZA PREDMET
app.post('/api/dnevnik/upis', async (req, res) => {
    try {
        const { odeljenjeId, profesorId, predmetId, brCasa, opisCasa, odsutniUcenici } = req.body;
        const danasnjiDatum = new Date().toISOString().split('T')[0];

        const noviCas = new Cas({ odeljenjeId, profesorId, predmetId, brCasa, opisCasa, datum: danasnjiDatum });
        await noviCas.save();

        if (Array.isArray(odsutniUcenici) && odsutniUcenici.length > 0) {
            await Ucenik.updateMany(
                { _id: { $in: odsutniUcenici } },
                { 
                    $push: { 
                        izostanci: { cas: brCasa, status: "Neopravdano", datum: danasnjiDatum, predmetId: predmetId } 
                    } 
                }
            );
        }
        res.status(201).json({ success: true, message: "Čas i izostanci uspešno upisani!" });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 📌 UPRAVLJANJE IZOSTANCIMA
app.put('/api/ucenici/:ucenikId/izostanci/:izostanakId', async (req, res) => {
    try {
        const { ucenikId, izostanakId } = req.params;
        const { status } = req.body;
        const ucenik = await Ucenik.findOneAndUpdate(
            { _id: ucenikId, "izostanci._id": izostanakId },
            { $set: { "izostanci.$.status": status } },
            { new: true }
        );
        res.json(ucenik);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/ucenici/:ucenikId/izostanci/:izostanakId', async (req, res) => {
    try {
        const { ucenikId, izostanakId } = req.params;
        const ucenik = await Ucenik.findByIdAndUpdate(
            ucenikId,
            { $pull: { izostanci: { _id: izostanakId } } },
            { new: true }
        );
        res.json(ucenik);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.listen(PORT, () => {
    console.log(`🚀 Server uspešno pokrenut na portu ${PORT}`);
});
