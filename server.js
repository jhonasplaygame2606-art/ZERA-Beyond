const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "data");
const DB_FILE = path.join(DATA, "newzera-db.json");

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
}

function readDB() {
    try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
    catch { return { users: {} }; }
}
function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const sessions = new Map();

function json(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch { reject(new Error("JSON inválido")); }
        });
        req.on("error", reject);
    });
}

function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}
function createPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    return { salt, hash: hashPassword(password, salt) };
}
function checkPassword(password, user) {
    const hash = hashPassword(password, user.salt);
    try {
        return crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(user.hash, "hex")
        );
    } catch { return false; }
}
function newToken() { return crypto.randomBytes(32).toString("hex"); }

function getUser(req) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return null;
    const session = sessions.get(auth.substring(7));
    if (!session) return null;
    const db = readDB();
    return db.users[session.username] || null;
}

function emptyHands() { return [null, null]; }
function emptyBackpack() { return [null, null, null, null, null, null, null]; }

function defaultPhase() {
    return {
        unlocked: false,
        completed: false,
        x: 150,
        y: 150,
        hp: 100,
        hunger: 100,
        hands: emptyHands(),
        backpack: emptyBackpack(),
        collected: [],
        openedChests: [],
        npcsTalked: [],
        houseTaken: [],
        bossDefeated: false,
    };
}

function createUser(name, password) {
    const pass = createPassword(password);
    const phases = {};
    for (let i = 1; i <= 10; i++) phases[i] = defaultPhase();
    phases[1].unlocked = true;
    phases[1].backpack[0] = { id: "food", type: "food", amount: 2 };
    phases[1].backpack[1] = { id: "medkit", type: "medkit", amount: 1 };
    phases[1].backpack[2] = { id: "knife", type: "knife", amount: 1 };

    return {
        name,
        salt: pass.salt,
        hash: pass.hash,
        unlockedPhase: 1,
        selectedPhase: 1,
        phases,
    };
}

async function api(req, res, pathname) {
    if (req.method === "POST" && pathname === "/api/register") {
        try {
            const data = await readBody(req);
            const name = String(data.name || "").trim();
            const password = String(data.password || "");

            if (name.length < 3) return json(res, 400, { error: "Nome muito curto." });
            if (password.length < 4) return json(res, 400, { error: "Senha muito curta." });

            const db = readDB();
            const key = name.toLowerCase();
            if (db.users[key]) return json(res, 400, { error: "Essa conta já existe." });

            const user = createUser(name, password);
            db.users[key] = user;
            saveDB(db);

            const token = newToken();
            sessions.set(token, { username: key });

            return json(res, 200, {
                ok: true,
                token,
                user: {
                    name: user.name,
                    unlockedPhase: user.unlockedPhase,
                    selectedPhase: user.selectedPhase,
                },
            });
        } catch {
            return json(res, 400, { error: "Erro ao criar conta." });
        }
    }

    if (req.method === "POST" && pathname === "/api/login") {
        try {
            const data = await readBody(req);
            const name = String(data.name || "").trim().toLowerCase();
            const password = String(data.password || "");

            const db = readDB();
            const user = db.users[name];

            if (!user || !checkPassword(password, user)) {
                return json(res, 401, { error: "Nome ou senha incorretos." });
            }

            const token = newToken();
            sessions.set(token, { username: name });

            return json(res, 200, {
                ok: true,
                token,
                user: {
                    name: user.name,
                    unlockedPhase: user.unlockedPhase,
                    selectedPhase: user.selectedPhase,
                },
            });
        } catch {
            return json(res, 400, { error: "Erro ao fazer login." });
        }
    }

    if (req.method === "GET" && pathname === "/api/me") {
        const user = getUser(req);
        if (!user) return json(res, 401, { error: "Não conectado." });
        return json(res, 200, { ok: true, user });
    }

    if (req.method === "POST" && pathname === "/api/save") {
        try {
            const user = getUser(req);
            if (!user) return json(res, 401, { error: "Sessão expirada." });

            const data = await readBody(req);
            const phase = Number(data.phase);
            if (phase < 1 || phase > 10) return json(res, 400, { error: "Fase inválida." });

            const db = readDB();
            const key = user.name.toLowerCase();
            const oldPhase = db.users[key].phases[phase] || defaultPhase();

            const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));

            const wasCompleted = Boolean(oldPhase.completed);
            const incomingCompleted = Boolean(data.completed);
            const finalCompleted = wasCompleted || incomingCompleted;
            const finalUnlocked = Boolean(oldPhase.unlocked) || finalCompleted || phase === 1;

            db.users[key].phases[phase] = {
                ...oldPhase,
                x: Number(data.x) || oldPhase.x,
                y: Number(data.y) || oldPhase.y,
                hp: clamp(data.hp ?? oldPhase.hp, 1, 100),
                hunger: clamp(data.hunger ?? oldPhase.hunger, 0, 100),

                hands: Array.isArray(data.hands)
                    ? data.hands.map((s) => (s && typeof s === "object" ? {
                        id: s.id, type: s.type, amount: Math.max(1, Number(s.amount) || 1),
                    } : null)).slice(0, 2)
                    : oldPhase.hands,

                backpack: Array.isArray(data.backpack)
                    ? data.backpack.map((s) => (s && typeof s === "object" ? {
                        id: s.id, type: s.type, amount: Math.max(1, Number(s.amount) || 1),
                    } : null)).slice(0, 7)
                    : oldPhase.backpack,

                collected: Array.isArray(data.collected) ? data.collected : oldPhase.collected,
                openedChests: Array.isArray(data.openedChests) ? data.openedChests : oldPhase.openedChests,
                npcsTalked: Array.isArray(data.npcsTalked) ? data.npcsTalked : oldPhase.npcsTalked,
                houseTaken: Array.isArray(data.houseTaken) ? data.houseTaken : oldPhase.houseTaken,
                bossDefeated: Boolean(data.bossDefeated) || Boolean(oldPhase.bossDefeated),

                completed: finalCompleted,
                unlocked: finalUnlocked,
            };

            if (finalCompleted && phase < 10) {
                const next = phase + 1;
                db.users[key].phases[next].unlocked = true;
                if (db.users[key].unlockedPhase < next) db.users[key].unlockedPhase = next;
            }

            if (db.users[key].unlockedPhase < phase) db.users[key].unlockedPhase = phase;
            db.users[key].phases[1].unlocked = true;
            db.users[key].selectedPhase = phase;
            saveDB(db);

            return json(res, 200, { ok: true, unlockedPhase: db.users[key].unlockedPhase });
        } catch (e) {
            console.error(e);
            return json(res, 400, { error: "Erro ao salvar." });
        }
    }

    if (req.method === "POST" && pathname === "/api/logout") {
        const auth = req.headers.authorization || "";
        if (auth.startsWith("Bearer ")) sessions.delete(auth.substring(7));
        return json(res, 200, { ok: true });
    }

    return false;
}

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

        if (url.pathname.startsWith("/api/")) {
            const handled = await api(req, res, url.pathname);
            if (handled !== false) return;
        }

        let file = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.substring(1));
        const filePath = path.normalize(path.join(PUBLIC, file));

        if (!filePath.startsWith(PUBLIC)) {
            res.writeHead(403);
            return res.end("Acesso negado.");
        }

        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            return res.end("Arquivo não encontrado.");
        }

        const ext = path.extname(filePath).toLowerCase();
        const types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".mp3": "audio/mpeg",
            ".ico": "image/x-icon",
        };

        res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.writeHead(500);
        res.end("Erro interno.");
    }
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.log("\n==================================");
        console.log("A porta", PORT, "já está em uso.");
        console.log("==================================\n");
    } else console.error(err);
});

server.listen(PORT, () => {
    console.log("\n==================================");
    console.log("       ZERA: BEYOND — ONLINE");
    console.log("==================================");
    console.log(`Jogo: http://localhost:${PORT}\n`);
});