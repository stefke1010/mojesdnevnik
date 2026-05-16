const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Služi index.html iz istog foldera

// Povezivanje na MongoDB preko ekološke varijable sa Rendera
const MONGO_URI = mongodb+srv://stefanmihajlovic:mojesdnevnik@cluster0.y9ztubl.mongodb.net/?appName=Cluster0;

if (!MONGO_URI) {
    console.error("KRITIČNA GREŠKA: MONGO_URI nije podešen u Environment Variables na Renderu!");
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("Uspešno povezan na trajnu MongoDB bazu!"))
    .catch(err => console.error("Greška sa bazom:", err));

// Kreiranje šeme za bazu podataka
const DnevnikSchema = new mongoose.Schema({
    kljuc: { type: String, default: "glavna_baza", unique: true },
    predmeti: Array,
    ucenici: Object,
    nastavnici: Array,
    casovi: Array,
    skola_naziv: String
});

const DnevnikModel = mongoose.model('DnevnikPodaci', DnevnikSchema);

// Početni podaci ako je baza potpuno prazna na prvom pokretanju
const inicijalniPodaci = {
    predmeti: [
        { id: "Srpski", naziv: "Српски језик" },
        { id: "Matematika", naziv: "Математика" },
        { id: "Engleski", naziv: "Енглески језик" }
    ],
    ucenici: {
        "V-3": [
            { id: 1, ime: "Марко Јовановић", izostanci:[], aktivnosti:[] },
            { id: 2, ime: "Јелена Крстић", izostanci:[], aktivnosti:[] }
        ]
    },
    nastavnici: [
        { id: 101, ime: "Стефан Михајловић", uloga: "Admin", username: "admin", password: "admin123", odeljenja: [], predmeti: [] },
        { id: 102, ime: "Милена Антић", uloga: "Nastavnik", username: "milena", password: "nastavnik123", odeljenja: ["V-3"], predmeti: ["Engleski"] }
    ],
    casovi: [],
    skola_naziv: "ОШ „Доситеј Обрадовић“"
};

// RUTA 1: Povlačenje podataka iz baze
app.get('/api/podaci', async (req, res) => {
    try {
        let podaci = await DnevnikModel.findOne({ kljuc: "glavna_baza" });
        if (!podaci) {
            podaci = new DnevnikModel(inicijalniPodaci);
            await podaci.save();
        }
        res.json(podaci);
    } catch (err) {
        res.status(500).json({ greska: err.message });
    }
});

// RUTA 2: Čuvanje svih izmena u bazu
app.post('/api/sacuvaj', async (req, res) => {
    try {
        await DnevnikModel.findOneAndUpdate(
            { kljuc: "glavna_baza" },
            { 
                predmeti: req.body.predmeti,
                ucenici: req.body.ucenici,
                nastavnici: req.body.nastavnici,
                casovi: req.body.casovi,
                skola_naziv: req.body.skola_naziv
            },
            { upsert: true }
        );
        res.json({ status: "uspesno", poruka: "Podaci trajno sačuvani u MongoDB!" });
    } catch (err) {
        res.status(500).json({ greska: err.message });
    }
});

// Otvaranje index.html na glavnom domenu - ISPRAVLJENO za novu verziju Express-a
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server uspešno pokrenut na portu ${PORT}`);
});
