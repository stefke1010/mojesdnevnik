const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Render sam dodeljuje port preko procesa, a lokalno koristi 3000
const PORT = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔌 POVEZIVANJE NA MONGO DB 
// Čita tvoju varijablu sa Rendera (MONGO_URL), a ako pokreneš lokalno koristi rezervni link
const MONGO_URI = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/esdnevnik'; 

mongoose.connect(MONGO_URI)
    .then(() => console.log('🔄 Uspješno povezan na MongoDB!'))
    .catch(err => console.error('❌ Greška pri povezivanju na MongoDB:', err));

// ==================== MONGOOSE SHEME I MODELI ====================

// 1. Model za Odeljenja
const OdeljenjeSchema = new mongoose.Schema({
    oznaka: { type: String, required: true },
    razred: { type: String, required: true },
    smer: { type: String, required: true },
    staresina: { type: String, required: true }
});
const Odeljenje = mongoose.model('Odeljenje', OdeljenjeSchema);

// 2. Podshema za Izostanke (nalazi se unutar Učenika)
const IzostanakSchema = new mongoose.Schema({
    cas: { type: Number, required: true },
    status: { type: String, default: 'Neopravdano' }, // 'Opravdano' ili 'Neopravdano'
    datum: { type: String, required: true }
});

// 3. Model za Učenike
const UcenikSchema = new mongoose.Schema({
    odeljenjeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Odeljenje', required: true },
    imePrezime: { type: String, required: true },
    ocene: [{ type: Number }],
    vladanje: { type: String, default: 'Primerno (5)' },
    aktivnosti: { type: String, default: '' },
    izostanci: [IzostanakSchema]
});
const Ucenik = mongoose.model('Ucenik', UcenikSchema);

// 4. Model za Upisane Časove u Dnevnik
const CasSchema = new mongoose.Schema({
    odeljenjeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Odeljenje', required: true },
    brCasa: { type: Number, required: true },
    opisCasa: { type: String, required: true },
    datum: { type: String, required: true }
});
const Cas = mongoose.model('Cas', CasSchema);


// ==================== API RUTE (BACKEND LOGIKA) ====================

// 📌 RUTE ZA ODELJENJA
app.get('/api/odeljenja', async (req, res) => {
    try {
        const odeljenja = await Odeljenje.find();
        res.json(odeljenja.map(o => ({ 
            id: o._id, 
            oznaka: o.oznaka, 
            razred: o.razred, 
            smer: o.smer, 
            staresina: o.staresina 
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/odeljenja', async (req, res) => {
    try {
        const { oznaka, razred, smer, staresina } = req.body;
        const novoOdeljenje = new Odeljenje({ oznaka, razred, smer, staresina });
        await novoOdeljenje.save();
        res.status(201).json({ id: novoOdeljenje._id, oznaka, razred, smer, staresina });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
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
            izostanci: u.izostanci.map(i => ({ id: i._id, cas: i.cas, status: i.status, datum: i.datum }))
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ucenici', async (req, res) => {
    try {
        const { odeljenjeId, imePrezime } = req.body;
        const noviUcenik = new Ucenik({ odeljenjeId, imePrezime, ocene: [], izostanci: [] });
        await noviUcenik.save();
        res.status(201).json(noviUcenik);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 📌 AŽURIRANJE PROFILA UČENIKA (Tabovi: Ocene, vladanje, aktivnosti)
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
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 📌 UPISIVANJE ČASA I AUTOMATSKO DODAVANJE IZOSTANAKA (Časovi od 0 do 8)
app.post('/api/dnevnik/upis', async (req, res) => {
    try {
        const { odeljenjeId, brCasa, opisCasa, odsutniUcenici } = req.body;
        const danasnjiDatum = new Date().toISOString().split('T')[0];

        // 1. Upisivanje časa u bazu
        const noviCas = new Cas({ odeljenjeId, brCasa, opisCasa, datum: danasnjiDatum });
        await noviCas.save();

        // 2. Ako ima selektovanih odsutnih učenika, dodaj im izostanak u niz
        if (Array.isArray(odsutniUcenici) && odsutniUcenici.length > 0) {
            await Ucenik.updateMany(
                { _id: { $in: odsutniUcenici } },
                { 
                    $push: { 
                        izostanci: { cas: brCasa, status: "Neopravdano", datum: danasnjiDatum } 
                    } 
                }
            );
        }

        res.status(201).json({ success: true, message: "Čas i izostanci uspešno sačuvani!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 📌 UPRAVLJANJE IZOSTANCIMA (Pravdanje / Neopravdanje preko pozicionog $ operatora)
app.put('/api/ucenici/:ucenikId/izostanci/:izostanakId', async (req, res) => {
    try {
        const { ucenikId, izostanakId } = req.params;
        const { status } = req.body; // Primi npr. "Opravdano" ili "Neopravdano"

        const ucenik = await Ucenik.findOneAndUpdate(
            { _id: ucenikId, "izostanci._id": izostanakId },
            { $set: { "izostanci.$.status": status } },
            { new: true }
        );
        res.json(ucenik);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 📌 BRISANJE IZOSTANKA IZ MONGO NIZA ($pull operator)
app.delete('/api/ucenici/:ucenikId/izostanci/:izostanakId', async (req, res) => {
    try {
        const { ucenikId, izostanakId } = req.params;

        const ucenik = await Ucenik.findByIdAndUpdate(
            ucenikId,
            { $pull: { izostanci: { _id: izostanakId } } },
            { new: true }
        );
        res.json(ucenik);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Pokretanje servera na odgovarajućem portu
app.listen(PORT, () => {
    console.log(`🚀 Server uspešno pokrenut na portu ${PORT}`);
});
