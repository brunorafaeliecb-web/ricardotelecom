const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname)));

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS site_content (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`, () => initializeDefaults());
    }
});

const defaultContent = {
    headerLogoText: 'VendaTelecom',
    headerNav1: 'Controle',
    headerNav2: 'Pós-Pago',
    headerNav3: 'Empresarial',
    headerNav4: 'Operadoras',
    heroImage: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    heroTagline: 'A melhor revenda da sua região',
    heroTitleHtml: 'Descubra os <span class="text-blue-400">melhores planos</span> de telefonia para você ou sua empresa!',
    heroSubtitle: 'Consulte as melhores ofertas da Claro, Vivo, Tim, Neo e LesteTelecom. Comparamos os preços para você economizar.',
    heroBtnText: 'VER PLANOS',
    whatsappNumber: '5511999999999',
    whatsappBtnText: 'Consultor',
    claroName: 'Controle', claroGb: '50', claroPriceInt: '49', claroPriceFrac: ',90',
    vivoName: 'Pós-Pago', vivoGb: '100', vivoPriceInt: '149', vivoPriceFrac: ',90',
    timName: 'Tim Controle', timGb: '30', timPriceInt: '44', timPriceFrac: ',99',
    neoName: 'Digital', neoGb: '40', neoPriceInt: '39', neoPriceFrac: ',90',
    lesteName: 'Fibra', lesteGb: 'ILIMITADA', lestePriceInt: '99', lestePriceFrac: ',90',
    footerDesc: 'Conectando você ao que importa com as melhores ofertas do mercado.',
    footerCnpj: 'CNPJ: 00.000.000/0001-00',
    footerCopy: '&copy; 2026 VendaTelecom - Todos os direitos reservados.'
};

function initializeDefaults() {
    db.get("SELECT COUNT(*) AS count FROM site_content", (err, row) => {
        if (!err && row.count === 0) {
            const stmt = db.prepare("INSERT INTO site_content (key, value) VALUES (?, ?)");
            for (const [key, value] of Object.entries(defaultContent)) stmt.run(key, value);
            stmt.finalize();
        }
    });
}

function requireAdminToken(req, res, next) {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) return res.status(503).json({ error: 'admin_api_not_configured' });

    const auth = req.get('authorization') || '';
    const supplied = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    if (expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    next();
}

app.get('/api/content', (req, res) => {
    db.all("SELECT key, value FROM site_content", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'database_error' });
        const data = {};
        rows.forEach(row => { data[row.key] = row.value; });
        res.json(data);
    });
});

app.post('/api/content', requireAdminToken, (req, res) => {
    const updates = req.body;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({ error: 'invalid_payload' });
    }
    db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO site_content (key, value) VALUES (?, ?)");
        for (const [key, value] of Object.entries(updates)) stmt.run(key, String(value));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ status: 'error', message: 'database_error' });
            res.json({ status: 'success', message: 'Conteúdo atualizado com sucesso.' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});
