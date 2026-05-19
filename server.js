const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE (OBAVEZNO ZA JSON I STATIČKE FAJLOVE) ===
// Ovo omogućava Expressu da čita podatke koje mu šalješ preko fetch-a u JSON formatu
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Služenje statičkih fajlova (HTML, CSS, JS) iz trenutnog foldera
// Pretpostavlja se da ti je HTML fajl u istom folderu ili u public-u
app.use(express.static(path.join(__dirname)));

// === RUTA ZA LOGIN (/api/login) ===
app.post('/api/login', async (req, res) => {
    const { email, lozinka } = req.body;

    // 1. Provera da li su polja uopšte poslata sa frontenda
    if (!email || !lozinka) {
        return res.status(400).json({ poruka: "Sva polja moraju biti popunjena!" });
    }

    try {
        // 2. OVDE KASNIJE SPAJAŠ SVOJU SUPABASE ILI POSTGRESQL BAZU
        // npr: const { data, error } = await supabase.auth.signInWithPassword({ email, password: lozinka });
        
        // Trenutna bezbedna provera za testiranje dok ne uvežeš bazu do kraja:
        if (email === "admin@skola.rs" && lozinka === "sifra123") {
            
            // Ako su podaci tačni, vraćamo status 200 (OK) i objekat sa podatkom o korisniku
            return res.status(200).json({
                poruka: "Uspešna prijava!",
                korisnik: {
                    ime: "Stefan Mihajlović",
                    rola: "nastavnik"
                }
            });
        } else {
            // Ako podaci ne odgovaraju, vraćamo 401 (Unauthorized)
            return res.status(401).json({ poruka: "Pogrešno korisničko ime ili lozinka!" });
        }

    } catch (error) {
        console.error("Sistemska greška na serveru:", error);
        return res.status(500).json({ poruka: "Greška na serveru prilikom prijave." });
    }
});

// === GLAVNA RUTA ZA SLUŽENJE HTML-A ===
app.get('*', (req, res) => {
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
