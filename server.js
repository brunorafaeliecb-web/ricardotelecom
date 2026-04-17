const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Banco de dados em memória (para simplificar, mas no disco para persistência real)
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS site_content (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`, () => {
            initializeDefaults();
        });
    }
});

// Valores padrão
const defaultContent = {
    // Header
    headerLogoText: 'VendaTelecom',
    headerNav1: 'Controle',
    headerNav2: 'Pós-Pago',
    headerNav3: 'Empresarial',
    headerNav4: 'Operadoras',
    
    // Hero
    heroImage: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    heroTagline: 'A melhor revenda da sua região',
    heroTitleHtml: 'Descubra os <span class="text-blue-400">melhores planos</span> de telefonia para você ou sua empresa!',
    heroSubtitle: 'Consulte as melhores ofertas da Claro, Vivo, Tim, Neo e LesteTelecom. Comparamos os preços para você economizar.',
    heroBtnText: 'VER PLANOS',
    
    // WhatsApp
    whatsappNumber: '5511999999999',
    whatsappBtnText: 'Consultor',
    
    // Planos
    claroName: 'Controle',
    claroGb: '50',
    claroPriceInt: '49',
    claroPriceFrac: ',90',
    
    vivoName: 'Pós-Pago',
    vivoGb: '100',
    vivoPriceInt: '149',
    vivoPriceFrac: ',90',
    
    timName: 'Tim Controle',
    timGb: '30',
    timPriceInt: '44',
    timPriceFrac: ',99',
    
    neoName: 'Digital',
    neoGb: '40',
    neoPriceInt: '39',
    neoPriceFrac: ',90',
    
    lesteName: 'Fibra',
    lesteGb: 'ILIMITADA',
    lestePriceInt: '99',
    lestePriceFrac: ',90',
    
    // Footer
    footerDesc: 'Conectando você ao que importa com as melhores ofertas do mercado.',
    footerCnpj: 'CNPJ: 00.000.000/0001-00',
    footerCopy: '&copy; 2026 VendaTelecom - Todos os direitos reservados.'
};

function initializeDefaults() {
    db.get("SELECT COUNT(*) AS count FROM site_content", (err, row) => {
        if (!err && row.count === 0) {
            console.log("Inicializando conteúdo padrão no banco...");
            const stmt = db.prepare("INSERT INTO site_content (key, value) VALUES (?, ?)");
            for (const [key, value] of Object.entries(defaultContent)) {
                stmt.run(key, value);
            }
            stmt.finalize();
        }
    });
}

// Retorna todo o conteúdo
app.get('/api/content', (req, res) => {
    db.all("SELECT key, value FROM site_content", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const data = {};
        rows.forEach(row => {
            data[row.key] = row.value;
        });
        res.json(data);
    });
});

// Atualiza o conteúdo
app.post('/api/content', (req, res) => {
    const updates = req.body;
    
    // Iniciar transação seria o ideal usando db.serialize
    db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO site_content (key, value) VALUES (?, ?)");
        for (const [key, value] of Object.entries(updates)) {
            stmt.run(key, value);
        }
        stmt.finalize((err) => {
            if (err) {
                res.status(500).json({ status: "error", message: err.message });
            } else {
                res.json({ status: "success", message: "Conteúdo atualizado com sucesso no banco de dados!" });
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
    console.log(`Página original: http://localhost:${PORT}/index.html`);
    console.log(`Painel Admin: http://localhost:${PORT}/admin.html`);
});
