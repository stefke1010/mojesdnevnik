const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE (OBAVEZNO ZA JSON I STATIČKE FAJLOVE) ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Služenje statičkih fajlova (HTML, CSS, JS) iz trenutnog direktorijuma projektu
app.use(express.static(path.join(__dirname)));

// === RUTA ZA LOGIN (/api/login) ===
app.post('/api/login', async (req, res) => {
    const { email, lozinka } = req.body;

    if (!email || !lozinka) {
        return res.status(400).json({ poruka: "Sva polja moraju biti popunjena!" });
    }

    try {
        // Privremena provera za testiranje dok se ne poveže Supabase/PostgreSQL do kraja
        if (email === "admin@skola.rs" && lozinka === "sifra123") {
            return res.status(200).json({
                poruka: "Uspešna prijava!",
                korisnik: {
                    ime: "Stefan Mihajlović",
                    rola: "nastavnik"
                }
            });
        } else {
            return res.status(401).json({ poruka: "Pogrešno korisničko ime ili lozinka!" });
        }
    } catch (error) {
        console.error("Sistemska greška na serveru:", error);
        return res.status(500).json({ poruka: "Greška na serveru prilikom prijave." });
    }
});

// === GLAVNA RUTA ZA SLUŽENJE HTML-A (KONAČNO REŠENJE BEZ REGEX GREŠAKA) ===
// app.use hvata sve ostale zahteve koji nisu prošli kroz /api/login i bezbedno šalje index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// === POKRETANJE SERVERA ===
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Server uspešno pokrenut na adresi: http://localhost:${PORT}`);
    console.log(`🔐 Test login podaci:`);
    console.log(`   Korisnik: admin@skola.rs`);
    console.log(`   Lozinka:  sifra123`);
    console.log(`==================================================\n`);
});
