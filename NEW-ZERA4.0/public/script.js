const $ = (id) => document.getElementById(id);
const ASSETS = "/assets/";

let authToken = localStorage.getItem("newzera_token") || null;
let currentUser = null;
let game = null;
let gameRunning = false;
let paused = false;
let backpackOpen = false;
let dialogOpen = false;
let interiorOpen = false;
let storyOpen = false;

let lastTime = 0;
let saveTimer = 0;
let hungerTimer = 0;

let keys = {};
let activeHand = 0;
let selectedSlot = null;

/* ============================================
   ITENS
============================================ */
const ITEMS = {
    food: { name: "Comida", icon: "🍎", stack: 9, consumable: true, effect: { hunger: 30 } },
    medkit: { name: "Kit Médico", icon: "💊", stack: 5, consumable: true, effect: { hp: 40 } },
    bandage: { name: "Bandagem", icon: "🩹", stack: 9, consumable: true, effect: { hp: 15 } },
    ammo: { name: "Munição", icon: "🔫", stack: 30 },
    key: { name: "Chave", icon: "🔑", stack: 9 },
    coin: { name: "Moeda", icon: "🪙", stack: 99 },
    knife: { name: "Faca", icon: "🔪", stack: 1, weapon: true, dmg: 1 },
    pistol: { name: "Pistola", icon: "🔫", stack: 1, weapon: true, dmg: 2, ammo: true },
    bat: { name: "Bastão", icon: "🏏", stack: 1, weapon: true, dmg: 1 },
    medicamento: { name: "Medicamento", icon: "💉", stack: 1 },
    senha: { name: "Senha", icon: "📜", stack: 1 },
    codigo: { name: "Código", icon: "🗝️", stack: 1 },
    explosivo: { name: "Explosivo", icon: "🧨", stack: 1 },
    nucleo: { name: "Núcleo ZERA", icon: "💠", stack: 1 },
};

const ITEM = (id, amount = 1) => ({ id, type: id, amount });

/* ============================================
   TEMAS
============================================ */
const THEMES = {
    1: { "map-bg": "#1e2a1b", "wall-bg": "#2c2823", "wall-bd": "#4a443a", "bld-bg": "#3b3a36", "bld-bd": "#5c5850" },
    2: { "map-bg": "#1a1610", "wall-bg": "#2a2116", "wall-bd": "#8b7350", "bld-bg": "#3a2f1f", "bld-bd": "#a1854f" },
    3: { "map-bg": "#0a1208", "wall-bg": "#0d1a0d", "wall-bd": "#3a7d3a", "bld-bg": "#142a14", "bld-bd": "#4a8f4a" },
    4: { "map-bg": "#181018", "wall-bg": "#160a16", "wall-bd": "#8b4a8b", "bld-bg": "#2a1c2a", "bld-bd": "#a35ca3" },
    5: { "map-bg": "#101820", "wall-bg": "#08121c", "wall-bd": "#4a7d9d", "bld-bg": "#1c2c3a", "bld-bd": "#5c9bbd" },
    6: { "map-bg": "#1a1014", "wall-bg": "#2a1018", "wall-bd": "#a04050", "bld-bg": "#3a1a24", "bld-bd": "#c05070" },
    7: { "map-bg": "#08080c", "wall-bg": "#12121a", "wall-bd": "#4a4a70", "bld-bg": "#1a1a26", "bld-bd": "#5a5a80" },
    8: { "map-bg": "#141618", "wall-bg": "#22262a", "wall-bd": "#6a7080", "bld-bg": "#2a3038", "bld-bd": "#7a8090" },
    9: { "map-bg": "#12160c", "wall-bg": "#1c2212", "wall-bd": "#5a6a30", "bld-bg": "#222a14", "bld-bd": "#6a7a40" },
    10: { "map-bg": "#1a0808", "wall-bg": "#2a0a0a", "wall-bd": "#a02020", "bld-bg": "#3a0e0e", "bld-bd": "#c03030" },
};

/* ============================================
   DIFICULDADE
============================================ */
const DIFFICULTY = {
    1: { hp: 2, damage: 1, chaseSpeed: 0.55, patrolSpeed: 0.25, visionRange: 180 },
    2: { hp: 4, damage: 2, chaseSpeed: 0.70, patrolSpeed: 0.32, visionRange: 220 },
    3: { hp: 6, damage: 3, chaseSpeed: 0.85, patrolSpeed: 0.40, visionRange: 240 },
    4: { hp: 9, damage: 4, chaseSpeed: 0.95, patrolSpeed: 0.45, visionRange: 260 },
    5: { hp: 12, damage: 5, chaseSpeed: 1.05, patrolSpeed: 0.50, visionRange: 280 },
    6: { hp: 15, damage: 6, chaseSpeed: 1.15, patrolSpeed: 0.55, visionRange: 300 },
    7: { hp: 18, damage: 7, chaseSpeed: 1.25, patrolSpeed: 0.60, visionRange: 320 },
    8: { hp: 22, damage: 8, chaseSpeed: 1.35, patrolSpeed: 0.65, visionRange: 340 },
    9: { hp: 26, damage: 9, chaseSpeed: 1.45, patrolSpeed: 0.70, visionRange: 360 },
    10: { hp: 32, damage: 11, chaseSpeed: 1.55, patrolSpeed: 0.75, visionRange: 380 },
};

/* ============================================
   HISTÓRIAS
============================================ */
const STORIES = {
    1: { title: "FASE 1 — A CIDADE VAZIA", subtitle: "O primeiro dia do silêncio", text: "Você acordou sozinho no bairro onde cresceu. A cidade foi evacuada às pressas quando os primeiros infectados apareceram. Um bilhete no seu bolso diz: pegue a chave do posto e corra.", objective: "Pegue a chave e chegue até a saída." },
    2: { title: "FASE 2 — ZONA INDUSTRIAL", subtitle: "A promessa do rádio", text: "Um rádio velho repetia: \"Abrigo ativo na zona industrial.\" Aqui os infectados são mais rápidos. O Ferro-velho guardou uma pistola pra você.", objective: "Fale com o Ferro-velho, pegue a chave e alcance a saída." },
    3: { title: "FASE 3 — O LABIRINTO", subtitle: "Onde os que entraram não voltaram", text: "Catacumbas de concreto. Corredores estreitos, becos sem saída. Ache a chave, ache o Médico, e escape.", objective: "Explore o labirinto, ache a chave, abra um baú e fale com o Médico." },
    4: { title: "FASE 4 — CENTRO DA CIDADE", subtitle: "A última transmissão", text: "A torre de rádio ainda transmite. Duas pessoas ainda vivem no centro. A saída está trancada. Você precisa da chave e de informações.", objective: "Fale com 2 NPCs, ache a chave, abra o cofre e alcance a torre." },
    5: { title: "FASE 5 — BUNKER PERDIDO", subtitle: "Abaixo do chão", text: "Bunker militar abandonado. Dois guardas ainda resistem. Dois cofres guardam o que você precisa.", objective: "Fale com 2 guardas, ache 2 chaves, abra 2 cofres e chegue ao fundo do bunker." },
    6: { title: "FASE 6 — HOSPITAL ABANDONADO", subtitle: "Onde tudo começou", text: "O hospital onde os primeiros infectados foram tratados. Três médicos enlouqueceram tentando achar a cura. Os corredores estão cheios.", objective: "Ache a chave, abra 2 armários, fale com 3 sobreviventes e escape." },
    7: { title: "FASE 7 — METRÔ SUBTERRÂNEO", subtitle: "Nos túneis com eles", text: "Estação de metrô abandonada. Escuro total. Antes de sair, você PRECISA pegar o medicamento do vagão traseiro.", objective: "Fale com 3 sobreviventes, ache a chave, abra 2 baús, pegue o medicamento e saia." },
    8: { title: "FASE 8 — PRISÃO DE SEGURANÇA", subtitle: "Os piores ficaram aqui", text: "A prisão foi usada como abrigo. Deu errado. A saída tem senha.", objective: "Fale com 3 NPCs, ache a chave, abra 3 celas, pegue a senha e saia." },
    9: { title: "FASE 9 — COMPLEXO MILITAR", subtitle: "O último recurso", text: "O exército tentou conter tudo aqui. Falharam. A saída exige um código e um explosivo.", objective: "Fale com 4 NPCs, ache 2 chaves, abra 3 cofres, pegue o código e o explosivo, e escape." },
    10: { title: "FASE 10 — ZERA: BEYOND", subtitle: "O fim de tudo", text: "Você chegou. Um NÚCLEO guarda a resposta de tudo. E o que te espera no fim não é humano.", objective: "Fale com 4 NPCs, ache 2 chaves, abra 4 cofres, pegue o código e o núcleo, e enfrente o BOSS." },
};

/* ============================================
   LABIRINTO (FASE 3)
============================================ */
function buildLabyrinth() {
    const COLS = 15, ROWS = 10, CELL = 120;
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const stack = [[1, 1]];
    grid[1][1] = 0;

    while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];
        for (const [dx, dy] of dirs) {
            const nx = cx + dx * 2, ny = cy + dy * 2;
            if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1 && grid[ny][nx] === 1) {
                neighbors.push([nx, ny, cx + dx, cy + dy]);
            }
        }
        if (!neighbors.length) { stack.pop(); continue; }
        const [nx, ny, wx, wy] = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[wy][wx] = 0;
        grid[ny][nx] = 0;
        stack.push([nx, ny]);
    }

    for (let i = 0; i < 10; i++) {
        const rx = 1 + Math.floor(Math.random() * (COLS - 2));
        const ry = 1 + Math.floor(Math.random() * (ROWS - 2));
        if (grid[ry][rx] === 1) grid[ry][rx] = 0;
    }

    grid[1][1] = 0;
    grid[1][2] = 0;
    grid[ROWS - 2][COLS - 2] = 0;
    grid[ROWS - 2][COLS - 3] = 0;

    const freeCells = [];
    for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
            if (grid[y][x] === 0) {
                freeCells.push({ cx: x, cy: y, x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 });
            }
        }
    }

    const walls = [];
    for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
            if (grid[y][x] === 1) walls.push([x * CELL, y * CELL, CELL, CELL]);

    const spawn = { x: 1 * CELL + CELL / 2, y: 1 * CELL + CELL / 2 };
    const exit = { x: (COLS - 2) * CELL + CELL / 2, y: (ROWS - 2) * CELL + CELL / 2 };

    const isNearSpawn = (c) => Math.abs(c.cx - 1) <= 1 && Math.abs(c.cy - 1) <= 1;
    const isNearExit = (c) => Math.abs(c.cx - (COLS - 2)) <= 1 && Math.abs(c.cy - (ROWS - 2)) <= 1;
    const available = freeCells.filter((c) => !isNearSpawn(c) && !isNearExit(c));

    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }

    const items = [];
    const itemTypes = ["key", "key", "medkit", "ammo", "ammo", "food", "food", "bandage", "pistol", "chest", "chest", "coin"];
    let idx = 0;
    for (const t of itemTypes) {
        if (idx >= available.length) break;
        const c = available[idx++];
        items.push([t, c.x, c.y]);
    }

    const enemies = [];
    for (let i = 0; i < 10 && idx < available.length; i++) {
        const c = available[idx++];
        if (Math.hypot(c.x - spawn.x, c.y - spawn.y) > 200) enemies.push([c.x, c.y]);
    }

    const npcCell = available[idx++] || available[0];
    const npcs = [{ id: 0, x: npcCell.x, y: npcCell.y, name: "Médico", text: "Pegue o kit. A saída está no canto oposto." }];

    const houseCell = available[idx++] || available[0];
    const house = { x: houseCell.x, y: houseCell.y, name: "Abrigo", items: ["bandage", "ammo", "coin"] };

    return { walls, spawn, exit, items, enemies, npcs, house };
}

const LAB = buildLabyrinth();

/* ============================================
   FASES
============================================ */
const PHASES = {
    1: {
        name: "A CIDADE VAZIA",
        objective: "Pegue a chave e chegue até a saída.",
        player: { x: 150, y: 150 },
        exit: { x: 1650, y: 1050 },
        house: { x: 900, y: 500, name: "Casa Abandonada", items: ["medkit", "ammo", "food"] },
        requiredKeys: 1, requiredChests: 0, requiredNpcs: [], requiredExtras: [],
        walls: [
            [400, 150, 300, 70], [850, 150, 400, 70],
            [300, 450, 100, 400], [700, 350, 350, 80],
            [1200, 400, 400, 80], [850, 700, 100, 350],
            [300, 950, 400, 80], [1100, 900, 300, 80],
        ],
        buildings: [
            { x: 80, y: 300, w: 180, h: 120 },
            { x: 500, y: 600, w: 180, h: 160 },
            { x: 1100, y: 150, w: 180, h: 150 },
            { x: 1400, y: 500, w: 220, h: 180 },
        ],
        enemies: [[600, 300], [1000, 500], [1450, 350], [500, 900]],
        npcs: [],
        items: [
            ["food", 250, 250], ["ammo", 500, 300],
            ["key", 1400, 800], ["medkit", 800, 550],
            ["chest", 1150, 750], ["knife", 700, 900],
        ],
    },
    2: {
        name: "ZONA INDUSTRIAL",
        objective: "Fale com o Ferro-velho, pegue a chave e alcance a saída.",
        player: { x: 120, y: 1050 },
        exit: { x: 1650, y: 150 },
        house: { x: 700, y: 550, name: "Galpão", items: ["pistol", "ammo", "coin"] },
        requiredKeys: 1, requiredChests: 0, requiredNpcs: ["Ferro-velho"], requiredExtras: [],
        walls: [
            [200, 200, 500, 70], [800, 200, 100, 400],
            [1000, 150, 500, 70], [400, 450, 400, 80],
            [1000, 550, 350, 80], [200, 750, 100, 300],
            [550, 850, 500, 80], [1200, 900, 400, 80],
        ],
        buildings: [
            { x: 100, y: 300, w: 180, h: 200 },
            { x: 850, y: 100, w: 100, h: 250 },
            { x: 1100, y: 300, w: 300, h: 180 },
            { x: 1350, y: 650, w: 250, h: 180 },
        ],
        enemies: [[350, 350], [650, 650], [1100, 700], [1450, 450], [1500, 950], [250, 600], [900, 400]],
        npcs: [
            { id: 0, x: 400, y: 1050, name: "Ferro-velho", text: "Achei essa pistola no lixo. Fica pra você." },
            { id: 1, x: 1300, y: 950, name: "Andarilho", text: "Vi um bando descendo pela rua. Cuidado." },
        ],
        items: [
            ["food", 300, 900], ["ammo", 600, 300], ["ammo", 1200, 700],
            ["key", 1500, 300], ["medkit", 900, 700],
            ["chest", 400, 650], ["pistol", 400, 1050], ["coin", 800, 950], ["coin", 1300, 200],
        ],
    },
    3: {
        name: "O LABIRINTO",
        objective: "Explore o labirinto, ache a chave, abra um baú e fale com o Médico.",
        player: LAB.spawn,
        exit: LAB.exit,
        house: LAB.house,
        requiredKeys: 1, requiredChests: 1, requiredNpcs: ["Médico"], requiredExtras: [],
        walls: LAB.walls,
        buildings: [],
        enemies: LAB.enemies,
        npcs: LAB.npcs,
        items: LAB.items,
    },
    4: {
        name: "CENTRO DA CIDADE",
        objective: "Fale com 2 NPCs, ache a chave, abra o cofre e alcance a torre.",
        player: { x: 150, y: 150 },
        exit: { x: 1650, y: 1050 },
        house: { x: 900, y: 950, name: "Loja Saqueada", items: ["food", "ammo", "knife"] },
        requiredKeys: 1, requiredChests: 1, requiredNpcs: ["Sobrevivente", "Velho Soldado"], requiredExtras: [],
        walls: [
            [350, 100, 80, 400], [350, 600, 80, 450],
            [700, 100, 80, 300], [700, 500, 80, 550],
            [1050, 100, 80, 500], [1050, 700, 80, 350],
            [1400, 150, 80, 350], [1400, 650, 80, 400],
            [430, 500, 620, 80],
        ],
        buildings: [
            { x: 100, y: 350, w: 170, h: 180 },
            { x: 480, y: 150, w: 150, h: 200 },
            { x: 820, y: 750, w: 170, h: 160 },
            { x: 1200, y: 300, w: 150, h: 180 },
            { x: 1500, y: 500, w: 180, h: 150 },
        ],
        enemies: [[500, 450], [900, 300], [900, 800], [1200, 650], [1550, 300], [1550, 800], [300, 200], [1300, 1000], [700, 900], [1100, 950], [600, 100], [1000, 1050]],
        npcs: [
            { id: 0, x: 200, y: 900, name: "Sobrevivente", text: "O cofre central está trancado." },
            { id: 1, x: 700, y: 1000, name: "Velho Soldado", text: "Peguei um cartão do exército." },
            { id: 2, x: 1550, y: 150, name: "Criança", text: "Meus pais foram pra torre." },
        ],
        items: [
            ["food", 200, 700], ["ammo", 500, 700], ["ammo", 1200, 150],
            ["key", 1550, 900], ["medkit", 900, 650],
            ["chest", 1250, 850], ["bandage", 700, 200], ["pistol", 1000, 1100],
        ],
    },
    5: {
        name: "BUNKER PERDIDO",
        objective: "Fale com 2 guardas, ache 2 chaves, abra 2 cofres e chegue ao fundo do bunker.",
        player: { x: 100, y: 600 },
        exit: { x: 1700, y: 600 },
        house: { x: 950, y: 250, name: "Bunker", items: ["medkit", "ammo", "pistol"] },
        requiredKeys: 2, requiredChests: 2, requiredNpcs: ["Guarda Ferido", "Cientista"], requiredExtras: [],
        walls: [
            [300, 100, 100, 400], [300, 700, 100, 400],
            [600, 200, 500, 80], [600, 920, 500, 80],
            [1200, 100, 100, 400], [1200, 700, 100, 400],
            [1450, 300, 80, 300], [1450, 700, 80, 250],
            [900, 500, 200, 80],
        ],
        buildings: [
            { x: 50, y: 150, w: 180, h: 180 },
            { x: 450, y: 400, w: 180, h: 160 },
            { x: 850, y: 400, w: 180, h: 160 },
            { x: 1350, y: 500, w: 180, h: 160 },
            { x: 1550, y: 150, w: 180, h: 180 },
        ],
        enemies: [[500, 300], [800, 700], [1100, 400], [1350, 650], [1600, 450], [1650, 850], [400, 900], [900, 150], [200, 1000], [1000, 1000], [700, 550], [1400, 200], [300, 500], [1500, 900]],
        npcs: [
            { id: 0, x: 200, y: 300, name: "Guarda Ferido", text: "Eles levaram o cofre pro centro." },
            { id: 1, x: 1300, y: 250, name: "Cientista", text: "Preciso de 2 chaves pra abrir o cofre." },
        ],
        items: [
            ["food", 200, 900], ["ammo", 500, 350], ["ammo", 950, 750],
            ["key", 1550, 850], ["key", 200, 1050], ["medkit", 1150, 600],
            ["chest", 1400, 250], ["chest", 500, 1050], ["pistol", 300, 300],
        ],
    },
    6: {
        name: "HOSPITAL ABANDONADO",
        objective: "Ache a chave, abra 2 armários, fale com 3 sobreviventes e escape.",
        player: { x: 120, y: 120 },
        exit: { x: 1680, y: 1080 },
        house: { x: 900, y: 1080, name: "Farmácia", items: ["medkit", "medkit", "bandage"] },
        requiredKeys: 1, requiredChests: 2, requiredNpcs: ["Médico-Chefe", "Enfermeira", "Paciente"], requiredExtras: [],
        walls: [
            // Moldura externa com PORTAS abertas
            [300, 300, 400, 60],       // topo esquerdo
            [900, 300, 400, 60],       // topo direito (porta superior no meio)
            [300, 900, 400, 60],       // base esquerda
            [900, 900, 400, 60],       // base direita  (porta inferior no meio)
            [300, 300, 60, 200],       // canto superior esquerdo
            [300, 600, 60, 360],       // lateral esquerda  (vão em y=500..600)
            [1440, 300, 60, 200],      // canto superior direito
            [1440, 600, 60, 360],      // lateral direita (vão em y=500..600)

            // Paredes internas
            [600, 420, 60, 300],
            [900, 480, 60, 300],
            [1200, 420, 60, 300],
        ],
        buildings: [
            { x: 400, y: 500, w: 180, h: 180 },
            { x: 750, y: 500, w: 180, h: 180 },
            { x: 1100, y: 500, w: 180, h: 180 },
            { x: 400, y: 950, w: 180, h: 100 },
            { x: 1100, y: 950, w: 180, h: 100 },
        ],
        enemies: [
            [400, 200], [700, 200], [1000, 200], [1300, 200], [1600, 200],
            [200, 500], [500, 500], [800, 500], [1100, 500], [1500, 500],
            [400, 800], [700, 800], [1000, 800], [1300, 800], [1600, 800],
            [200, 1050], [700, 1050], [1300, 1050], [1600, 1050],
        ],
        npcs: [
            { id: 0, x: 200, y: 200, name: "Médico-Chefe", text: "Preciso de 2 kits médicos. Estão nos armários do hospital." },
            { id: 1, x: 1600, y: 200, name: "Enfermeira", text: "O cofre da ala oeste tem a chave." },
            { id: 2, x: 200, y: 1050, name: "Paciente", text: "Não vou sair daqui. Vá sem mim." },
        ],
        items: [
            ["key", 1600, 300],
            ["medkit", 400, 500], ["medkit", 1200, 500],
            ["ammo", 500, 900], ["ammo", 1300, 900],
            ["chest", 900, 500],
            ["chest", 800, 950],
            ["food", 200, 700], ["pistol", 1600, 1000], ["bandage", 500, 1000],
        ],
    },
    7: {
        name: "METRÔ SUBTERRÂNEO",
        objective: "Fale com 3 sobreviventes, ache a chave, abra 2 baús, pegue o medicamento e saia.",
        player: { x: 100, y: 1000 },
        exit: { x: 1700, y: 100 },
        house: { x: 900, y: 600, name: "Vagão Antigo", items: ["pistol", "ammo", "medkit"] },
        requiredKeys: 1, requiredChests: 2, requiredNpcs: ["Maquinista", "Passageiro", "Segurança"], requiredExtras: ["medicamento"],
        walls: [
            [200, 200, 60, 800],
            [500, 200, 60, 800],
            [800, 200, 60, 800],
            [1100, 200, 60, 800],
            [1400, 200, 60, 800],
            [300, 400, 200, 60],
            [900, 400, 200, 60],
            [1300, 500, 200, 60],
            [300, 700, 200, 60],
            [900, 700, 200, 60],
            [1300, 800, 200, 60],
        ],
        buildings: [],
        enemies: [[350, 300], [650, 300], [950, 300], [1250, 300], [1550, 300],
        [350, 600], [650, 600], [950, 600], [1250, 600], [1550, 600],
        [350, 900], [650, 900], [950, 900], [1250, 900], [1550, 900],
        [200, 500], [800, 500], [1200, 800], [1500, 1000], [100, 500], [1000, 1000], [1700, 500], [600, 1000], [1400, 100]],
        npcs: [
            { id: 0, x: 300, y: 500, name: "Maquinista", text: "O medicamento está no vagão traseiro." },
            { id: 1, x: 1000, y: 500, name: "Passageiro", text: "Vi algo se mexendo no túnel oeste." },
            { id: 2, x: 1500, y: 600, name: "Segurança", text: "Tem uma chave no vagão central." },
        ],
        items: [
            ["key", 900, 500], ["medicamento", 1500, 200],
            ["ammo", 400, 400], ["ammo", 1300, 400],
            ["chest", 600, 800], ["chest", 1100, 800],
            ["food", 300, 900], ["pistol", 700, 100], ["medkit", 1200, 1000], ["bandage", 200, 800],
        ],
    },
    8: {
        name: "PRISÃO DE SEGURANÇA",
        objective: "Fale com 3 NPCs, ache a chave, abra 3 celas, pegue a senha e saia.",
        player: { x: 900, y: 1100 },
        exit: { x: 900, y: 100 },
        house: { x: 500, y: 600, name: "Sala dos Guardas", items: ["pistol", "ammo", "medkit"] },
        requiredKeys: 1, requiredChests: 3, requiredNpcs: ["Diretor", "Carcereiro", "Detento"], requiredExtras: ["senha"],
        walls: [
            [200, 200, 1400, 60],
            [200, 950, 1400, 60],
            [200, 200, 60, 800],
            [1540, 200, 60, 800],
            [500, 400, 60, 400],
            [800, 300, 60, 400],
            [1100, 400, 60, 400],
            [1400, 300, 60, 400],
        ],
        buildings: [
            { x: 250, y: 300, w: 200, h: 300 },
            { x: 600, y: 700, w: 200, h: 200 },
            { x: 850, y: 300, w: 200, h: 200 },
            { x: 1150, y: 700, w: 200, h: 200 },
            { x: 1350, y: 300, w: 150, h: 200 },
        ],
        enemies: [[300, 250], [700, 250], [1000, 250], [1200, 250], [1500, 250],
        [300, 700], [700, 700], [1000, 700], [1200, 700], [1500, 700],
        [300, 900], [700, 900], [1000, 900], [1200, 900], [1500, 900],
        [400, 500], [900, 500], [1300, 500], [600, 1000], [1100, 100], [400, 100], [1400, 100], [800, 500], [100, 500], [1700, 500]],
        npcs: [
            { id: 0, x: 300, y: 1050, name: "Diretor", text: "A senha está numa das celas." },
            { id: 1, x: 900, y: 1050, name: "Carcereiro", text: "Tem 3 celas trancadas." },
            { id: 2, x: 1500, y: 1050, name: "Detento", text: "Me solta que eu te ajudo." },
        ],
        items: [
            ["key", 300, 200], ["senha", 1000, 900],
            ["ammo", 500, 900], ["ammo", 1300, 900],
            ["chest", 400, 300], ["chest", 1100, 300], ["chest", 700, 850],
            ["food", 200, 700], ["pistol", 1500, 1050], ["medkit", 800, 100], ["bandage", 1300, 1050],
        ],
    },
    9: {
        name: "COMPLEXO MILITAR",
        objective: "Fale com 4 NPCs, ache 2 chaves, abra 3 cofres, pegue o código e o explosivo, e escape.",
        player: { x: 100, y: 100 },
        exit: { x: 1700, y: 1100 },
        house: { x: 900, y: 600, name: "Arsenal", items: ["pistol", "ammo", "medkit"] },
        requiredKeys: 2, requiredChests: 3, requiredNpcs: ["Sargento", "Tenente", "Médico de Campo", "Radio-Operador"], requiredExtras: ["codigo", "explosivo"],
        walls: [
            [300, 300, 200, 60], [700, 300, 300, 60], [1200, 300, 300, 60],
            [300, 700, 300, 60], [700, 700, 200, 60], [1000, 700, 500, 60],
            [500, 200, 60, 300], [900, 200, 60, 300], [1300, 200, 60, 300],
            [500, 800, 60, 300], [900, 800, 60, 300], [1300, 800, 60, 300],
        ],
        buildings: [
            { x: 150, y: 450, w: 120, h: 200 },
            { x: 750, y: 450, w: 150, h: 200 },
            { x: 1500, y: 450, w: 150, h: 200 },
            { x: 600, y: 100, w: 200, h: 100 },
            { x: 1100, y: 1100, w: 200, h: 80 },
        ],
        enemies: [[400, 200], [800, 200], [1200, 200], [1600, 200],
        [200, 600], [500, 600], [1000, 600], [1500, 600], [1700, 600],
        [400, 900], [700, 900], [1100, 900], [1600, 900],
        [300, 400], [600, 400], [1100, 400], [1400, 400],
        [400, 1000], [800, 1000], [1200, 1000], [200, 1000], [1700, 200], [700, 500], [1500, 1000], [900, 950]],
        npcs: [
            { id: 0, x: 200, y: 200, name: "Sargento", text: "Preciso de 2 chaves." },
            { id: 1, x: 900, y: 200, name: "Tenente", text: "O código está num cofre." },
            { id: 2, x: 1600, y: 200, name: "Médico de Campo", text: "Tem explosivo no depósito leste." },
            { id: 3, x: 800, y: 1050, name: "Radio-Operador", text: "Se achar o explosivo, abro o portão." },
        ],
        items: [
            ["key", 300, 200], ["key", 1500, 900],
            ["codigo", 900, 600], ["explosivo", 1600, 600],
            ["ammo", 600, 500], ["ammo", 1200, 500], ["ammo", 500, 1000],
            ["chest", 500, 400], ["chest", 1200, 400], ["chest", 800, 900],
            ["food", 200, 900], ["pistol", 100, 500], ["medkit", 1700, 100], ["bandage", 1000, 100],
        ],
    },
    10: {
        name: "ZERA: BEYOND",
        objective: "Fale com 4 NPCs, ache 2 chaves, abra 4 cofres, pegue o código e o núcleo, e enfrente o BOSS.",
        player: { x: 900, y: 1100 },
        exit: { x: 900, y: 100 },
        house: { x: 900, y: 600, name: "Sala do Núcleo", items: ["pistol", "medkit", "medkit"] },
        requiredKeys: 2, requiredChests: 4, requiredNpcs: ["Voz", "Cientista-Chefe", "Guarda-Chefe", "Filho"], requiredExtras: ["codigo", "nucleo"],
        hasBoss: true,
        walls: [
            [250, 250, 1300, 60], [250, 950, 1300, 60],
            [250, 250, 60, 700], [1490, 250, 60, 700],
            [500, 450, 200, 60], [900, 450, 200, 60], [1300, 450, 200, 60],
            [500, 750, 200, 60], [900, 750, 200, 60], [1300, 750, 200, 60],
        ],
        buildings: [
            { x: 300, y: 550, w: 180, h: 180 },
            { x: 750, y: 550, w: 180, h: 180 },
            { x: 1200, y: 550, w: 180, h: 180 },
            { x: 700, y: 300, w: 200, h: 100 },
        ],
        enemies: [[400, 300], [700, 300], [1000, 300], [1300, 300], [1600, 300],
        [300, 600], [700, 600], [1100, 600], [1400, 600],
        [300, 900], [600, 900], [1000, 900], [1300, 900], [1600, 900],
        [500, 400], [900, 400], [1200, 400], [500, 700], [1000, 700], [1400, 700],
        [400, 800], [800, 800], [1200, 800], [600, 1000], [1100, 100]],
        npcs: [
            { id: 0, x: 300, y: 200, name: "Voz", text: "O núcleo está guardado." },
            { id: 1, x: 700, y: 200, name: "Cientista-Chefe", text: "2 chaves, 4 cofres, código." },
            { id: 2, x: 1200, y: 200, name: "Guarda-Chefe", text: "Tem um Boss guardando o núcleo." },
            { id: 3, x: 1600, y: 200, name: "Filho", text: "Meu pai está lá dentro." },
        ],
        items: [
            ["key", 300, 200], ["key", 1600, 900],
            ["codigo", 700, 300], ["nucleo", 900, 200],
            ["ammo", 500, 300], ["ammo", 1200, 300], ["ammo", 700, 800], ["ammo", 1300, 800],
            ["chest", 400, 300], ["chest", 900, 300], ["chest", 1300, 300], ["chest", 1000, 1000],
            ["food", 200, 900], ["food", 1300, 1050],
            ["pistol", 200, 500], ["medkit", 700, 100], ["medkit", 1600, 100], ["bandage", 400, 1000],
        ],
    },
};

/* ============================================
   LOADING
============================================ */
const LOAD_ASSETS = [
    "/assets/logo.png",
    "/assets/playerfrente.png", "/assets/playertras.png",
    "/assets/playeresquerda.png", "/assets/playerdireita.png",
    "/assets/enemyfrente.png", "/assets/enemytras.png",
    "/assets/enemyesquerda.png", "/assets/enemydireita.png",
];

const LOADING_TIPS = [
    "Carregando recursos...",
    "Preparando a cidade...",
    "Sincronizando sobreviventes...",
    "Afinando armas...",
    "Aquecendo motores...",
    "Verificando baús...",
    "Quase lá...",
];

async function preload() {
    let loaded = 0;
    const total = LOAD_ASSETS.length;

    let tipIndex = 0;
    const tipEl = $("loadingTip");
    const tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % LOADING_TIPS.length;
        if (tipEl) tipEl.textContent = LOADING_TIPS[tipIndex];
    }, 700);

    const setProgress = (p) => {
        const pct = Math.min(100, Math.round(p));
        const bar = $("loadingProgress");
        const txt = $("loadingPercent");
        if (bar) bar.style.width = pct + "%";
        if (txt) txt.textContent = pct + "%";
    };

    setProgress(0);

    const tasks = LOAD_ASSETS.map((src) => new Promise((res) => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loaded++;
            setProgress((loaded / total) * 100);
            res();
        };
        img.src = src;
    }));

    await Promise.race([Promise.all(tasks), new Promise((r) => setTimeout(r, 4000))]);

    clearInterval(tipInterval);
    setProgress(100);
    if (tipEl) tipEl.textContent = "Pronto!";

    setTimeout(() => {
        const l = $("loading");
        if (l) l.classList.add("hidden");
        setTimeout(() => {
            if (authToken) tryLoginFromToken();
            else { const ls = $("loginScreen"); if (ls) ls.classList.remove("hidden"); }
        }, 400);
    }, 500);
}

async function tryLoginFromToken() {
    try { await loadUser(); openMenu(); }
    catch {
        authToken = null;
        localStorage.removeItem("newzera_token");
        const l = $("loginScreen"); if (l) l.classList.remove("hidden");
    }
}

/* ============================================
   LOGIN
============================================ */
function message(text) { const el = $("loginMessage"); if (el) el.textContent = text; }

async function login() {
    const name = $("loginName").value.trim();
    const password = $("loginPassword").value;
    if (!name || !password) return message("Digite nome e senha.");
    message("Entrando...");
    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password }),
        });
        const data = await res.json();
        if (!res.ok) return message(data.error || "Erro ao entrar.");
        authToken = data.token;
        localStorage.setItem("newzera_token", authToken);
        await loadUser();
        openMenu();
    } catch { message("Servidor não encontrado."); }
}

async function register() {
    const name = $("loginName").value.trim();
    const password = $("loginPassword").value;
    if (!name || !password) return message("Digite nome e senha.");
    message("Criando conta...");
    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password }),
        });
        const data = await res.json();
        if (!res.ok) return message(data.error || "Erro.");
        authToken = data.token;
        localStorage.setItem("newzera_token", authToken);
        await loadUser();
        openMenu();
    } catch { message("Servidor não encontrado."); }
}

async function loadUser() {
    const res = await fetch("/api/me", { headers: { Authorization: "Bearer " + authToken } });
    const data = await res.json();
    if (!res.ok) throw new Error("Sessão inválida");
    currentUser = data.user;
}

/* ============================================
   MENU
============================================ */
function openMenu() {
    stopGame();
    $("loginScreen").classList.add("hidden");
    $("gameScreen").classList.add("hidden");
    $("menuScreen").classList.remove("hidden");
    $("playerName").textContent = currentUser.name;
    renderPhases();
}

function renderPhases() {
    const container = $("phases");
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const phase = currentUser.phases[i] || { unlocked: false, completed: false };
        const data = PHASES[i];
        if (!data) continue;
        const card = document.createElement("div");
        card.className = "phase" + (phase.unlocked ? "" : " locked") + (i === 10 ? " boss" : "");
        const status = phase.completed ? "✓ CONCLUÍDA" : phase.unlocked ? "DESBLOQUEADA" : "BLOQUEADA";
        const icon = i === 10 ? "💀 " : "";
        card.innerHTML = `<div class="phaseNumber">${icon}FASE ${i}</div><h3>${data.name}</h3><p>${data.objective}</p><p>${status}</p>`;
        if (phase.unlocked) {
            const c = document.createElement("button");
            c.textContent = "CONTINUAR";
            c.onclick = () => window.startPhase(i, false);
            const r = document.createElement("button");
            r.className = "restart";
            r.textContent = "RECOMEÇAR";
            r.onclick = () => window.startPhase(i, true);
            card.appendChild(c); card.appendChild(r);
        } else {
            const l = document.createElement("button");
            l.disabled = true; l.textContent = "🔒 BLOQUEADA";
            card.appendChild(l);
        }
        container.appendChild(card);
    }
}

/* ============================================
   INICIAR FASE
============================================ */
window.startPhase = function (phaseNumber, restart) {
    if (!currentUser) { alert("Sessão perdida."); return; }
    const saved = currentUser.phases[phaseNumber] || {};
    const data = PHASES[phaseNumber];
    if (!data) { alert("Fase inválida."); return; }

    const cloneStack = (s) => (s ? { ...s } : null);

    const buildHands = () => {
        if (restart) return [ITEM("knife", 1), null];
        const h = (saved.hands || [null, null]).map(cloneStack);
        const noWeapon = !h[0] && !h[1];
        const hasWeaponInBag = (saved.backpack || []).some((s) => s && ITEMS[s.type]?.weapon);
        if (noWeapon && !hasWeaponInBag) h[0] = ITEM("knife", 1);
        return h;
    };

    const cfg = DIFFICULTY[phaseNumber];

    game = {
        number: phaseNumber,
        x: restart ? data.player.x : (saved.x ?? data.player.x),
        y: restart ? data.player.y : (saved.y ?? data.player.y),
        hp: restart ? 100 : (saved.hp ?? 100),
        hunger: restart ? 100 : (saved.hunger ?? 100),
        hands: buildHands(),
        backpack: restart
            ? [ITEM("food", 2), ITEM("medkit", 1), null, null, null, null, null]
            : (saved.backpack || new Array(7).fill(null)).map(cloneStack),
        collected: restart ? [] : [...(saved.collected || [])],
        openedChests: restart ? [] : [...(saved.openedChests || [])],
        npcsTalked: restart ? [] : [...(saved.npcsTalked || [])],
        houseTaken: restart ? [] : [...(saved.houseTaken || [])],
        bossDefeated: restart ? false : (saved.bossDefeated || false),
        enemies: data.enemies.map((e, idx) => ({
            id: idx, x: e[0], y: e[1], homeX: e[0], homeY: e[1],
            hp: cfg.hp, maxHp: cfg.hp, alive: true, attackTimer: 0,
            chasing: false, lastSeenX: null, lastSeenY: null,
            wanderTimer: 0, wanderDir: { x: 1, y: 0 },
        })),
        boss: data.hasBoss ? {
            x: 900, y: 200,
            hp: 120, maxHp: 120,
            alive: true, attackTimer: 0,
            chasing: false,
        } : null,
    };

    if (collides(game.x, game.y)) {
        game.x = data.player.x;
        game.y = data.player.y;
    }

    paused = false; backpackOpen = false; dialogOpen = false;
    interiorOpen = false; storyOpen = true; activeHand = 0;

    applyTheme(phaseNumber);
    $("menuScreen").classList.add("hidden");
    $("gameScreen").classList.remove("hidden");
    $("backpack").classList.add("hidden");
    $("pauseMenu").classList.add("hidden");
    $("complete").classList.add("hidden");
    $("dialog").classList.add("hidden");
    $("interior").classList.add("hidden");

    const story = STORIES[phaseNumber];
    if (story) {
        $("storyTitle").textContent = story.title;
        $("storySubtitle").textContent = story.subtitle;
        $("storyText").textContent = story.text;
        $("storyObjective").textContent = "Objetivo: " + story.objective;
        $("story").classList.remove("hidden");
    } else { storyOpen = false; $("story").classList.add("hidden"); }

    buildMap();
    updateHUD();
    refreshHandsHud();
    updateObjectives();
    render();

    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
};

function closeStory() {
    if (!storyOpen) return;
    storyOpen = false;
    $("story").classList.add("hidden");
    lastTime = performance.now();
}

function applyTheme(phaseNumber) {
    const theme = THEMES[phaseNumber] || THEMES[1];
    const map = $("map"); if (!map) return;
    for (const k in theme) map.style.setProperty("--" + k, theme[k]);
}

/* ============================================
   CONSTRUIR MAPA
============================================ */
function buildMap() {
    const data = PHASES[game.number];

    $("map").innerHTML = "";
    $("enemyBox").innerHTML = "";
    $("itemBox").innerHTML = "";
    $("npcBox").innerHTML = "";

    const backdrop = document.createElement("div");
    backdrop.className = "scene-backdrop phase-" + game.number;
    $("map").appendChild(backdrop);

    for (const b of (data.buildings || [])) {
        const el = document.createElement("div");
        el.className = "building";
        Object.assign(el.style, { left: b.x + "px", top: b.y + "px", width: b.w + "px", height: b.h + "px" });
        const roof = document.createElement("div"); roof.className = "roof"; el.appendChild(roof);
        const door = document.createElement("div"); door.className = "door"; el.appendChild(door);
        const wt = document.createElement("div"); wt.className = "window win-top"; el.appendChild(wt);
        if (b.w >= 150) {
            const wl = document.createElement("div"); wl.className = "window win-left"; el.appendChild(wl);
            const wr = document.createElement("div"); wr.className = "window win-right"; el.appendChild(wr);
        }
        $("map").appendChild(el);
    }

    for (const w of data.walls) {
        const el = document.createElement("div");
        el.className = "wall";
        Object.assign(el.style, { left: w[0] + "px", top: w[1] + "px", width: w[2] + "px", height: w[3] + "px" });
        $("map").appendChild(el);
    }

    $("exit").style.left = data.exit.x + "px";
    $("exit").style.top = data.exit.y + "px";

    for (const enemy of game.enemies) {
        const el = document.createElement("div");
        el.className = "enemy"; el.dataset.id = enemy.id;
        el.innerHTML = `<div class="enemyHealth"><div></div></div><img src="${ASSETS}enemyfrente.png" />`;
        $("enemyBox").appendChild(el);
    }

    if (game.boss && game.boss.alive) {
        const el = document.createElement("div");
        el.className = "boss-enemy";
        el.id = "bossEl";
        el.innerHTML = `<div class="enemyHealth"><div></div></div><img src="${ASSETS}enemyfrente.png" />`;
        el.style.left = game.boss.x + "px";
        el.style.top = game.boss.y + "px";
        $("enemyBox").appendChild(el);
    }

    data.npcs.forEach((npc) => {
        const el = document.createElement("div");
        el.className = "npc"; el.dataset.id = npc.id;
        el.textContent = "🧑";
        el.style.left = npc.x + "px";
        el.style.top = npc.y + "px";
        $("npcBox").appendChild(el);
    });

    if (data.house) {
        const h = document.createElement("div");
        h.className = "house-entry";
        h.textContent = "🚪";
        h.style.left = data.house.x + "px";
        h.style.top = data.house.y + "px";
        $("npcBox").appendChild(h);
    }

    data.items.forEach((item, index) => {
        const type = item[0];
        if (game.collected.includes(index)) return;
        if (type === "chest" && game.openedChests.includes(index)) return;
        const el = document.createElement("div");
        el.className = "item" + (type === "chest" ? " chest" : "");
        el.dataset.id = index;
        el.textContent = type === "chest" ? "📦" : (ITEMS[type]?.icon || "?");
        el.style.left = item[1] + "px";
        el.style.top = item[2] + "px";
        $("itemBox").appendChild(el);
    });
}

/* ============================================
   OBJETIVOS
============================================ */
function updateObjectives() {
    if (!game) return;
    const data = PHASES[game.number];
    const el = $("objectives");
    el.innerHTML = "<h4>OBJETIVOS</h4>";

    const keys = countItem("key");
    const chests = game.openedChests.length;
    const reqKey = data.requiredKeys || 0;
    const reqChest = data.requiredChests || 0;
    const reqNpcs = data.requiredNpcs || [];
    const reqExtras = data.requiredExtras || [];

    if (reqKey > 0) {
        const done = keys >= reqKey;
        el.innerHTML += `<div class="objItem ${done ? "done" : ""}"><span class="check">${done ? "✔" : "○"}</span>Pegar ${reqKey} chave${reqKey > 1 ? "s" : ""} (${Math.min(keys, reqKey)}/${reqKey})</div>`;
    }
    if (reqChest > 0) {
        const done = chests >= reqChest;
        el.innerHTML += `<div class="objItem ${done ? "done" : ""}"><span class="check">${done ? "✔" : "○"}</span>Abrir ${reqChest} baú${reqChest > 1 ? "s" : ""} (${Math.min(chests, reqChest)}/${reqChest})</div>`;
    }
    reqNpcs.forEach((npcName) => {
        const npc = data.npcs.find((n) => n.name === npcName);
        const done = npc ? game.npcsTalked.includes(npc.id) : false;
        el.innerHTML += `<div class="objItem ${done ? "done" : ""}"><span class="check">${done ? "✔" : "○"}</span>Falar com ${npcName}</div>`;
    });
    const extraLabels = {
        medicamento: "Pegar o medicamento",
        senha: "Pegar a senha do portão",
        codigo: "Pegar o código de acesso",
        explosivo: "Pegar o explosivo",
        nucleo: "Pegar o núcleo ZERA",
    };
    reqExtras.forEach((extra) => {
        const done = countItem(extra) > 0;
        el.innerHTML += `<div class="objItem ${done ? "done" : ""}"><span class="check">${done ? "✔" : "○"}</span>${extraLabels[extra] || ("Pegar " + extra)}</div>`;
    });

    if (data.hasBoss) {
        const bossDone = game.bossDefeated;
        el.innerHTML += `<div class="objItem ${bossDone ? "done" : ""}"><span class="check">${bossDone ? "✔" : "○"}</span>Derrotar o BOSS</div>`;
    }

    const ready = isExitUnlocked();
    el.innerHTML += `<div class="objItem ${ready ? "done" : ""}"><span class="check">${ready ? "✔" : "○"}</span>${ready ? "Ir até a saída" : "Saída trancada"}</div>`;
}

function isExitUnlocked() {
    if (!game || !currentUser) return false;
    const data = PHASES[game.number];
    if (currentUser.phases[game.number]?.completed) return true;
    const keys = countItem("key");
    const chests = game.openedChests.length;
    if (keys < (data.requiredKeys || 0)) return false;
    if (chests < (data.requiredChests || 0)) return false;
    for (const npcName of (data.requiredNpcs || [])) {
        const npc = data.npcs.find((n) => n.name === npcName);
        if (!npc || !game.npcsTalked.includes(npc.id)) return false;
    }
    for (const extra of (data.requiredExtras || [])) {
        if (countItem(extra) <= 0) return false;
    }
    if (data.hasBoss && !game.bossDefeated) return false;
    return true;
}

/* ============================================
   LOOP
============================================ */
function loop(time) {
    if (!gameRunning) return;
    const dt = Math.min(50, time - lastTime);
    lastTime = time;
    if (!paused && !backpackOpen && !dialogOpen && !interiorOpen && !storyOpen) update(dt);
    render();
    requestAnimationFrame(loop);
}

function update(dt) {
    movePlayer(dt);
    updateEnemies(dt);
    checkItems();

    hungerTimer += dt;
    if (hungerTimer >= 5000) {
        hungerTimer = 0;
        game.hunger = Math.max(0, game.hunger - 1);
        if (game.hunger === 0) game.hp = Math.max(1, game.hp - 1);
    }
    saveTimer += dt;
    if (saveTimer >= 4000) { saveTimer = 0; saveGame(); }

    $("danger").classList.toggle("on", game.hp <= 25);
    updateHUD();
    updateObjectives();

    const exitEl = $("exit");
    if (isExitUnlocked()) exitEl.classList.remove("locked");
    else exitEl.classList.add("locked");
}

/* ============================================
   MOVIMENTO
============================================ */
function movePlayer(dt) {
    let dx = 0, dy = 0;
    if (keys["w"] || keys["ArrowUp"]) dy -= 1;
    if (keys["s"] || keys["ArrowDown"]) dy += 1;
    if (keys["a"] || keys["ArrowLeft"]) dx -= 1;
    if (keys["d"] || keys["ArrowRight"]) dx += 1;
    if (!dx && !dy) return;
    const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    const speed = 3;
    const newX = game.x + (dx * speed * dt) / 16;
    const newY = game.y + (dy * speed * dt) / 16;
    if (!collides(newX, game.y)) game.x = Math.max(30, Math.min(1770, newX));
    if (!collides(game.x, newY)) game.y = Math.max(30, Math.min(1170, newY));

    if (Math.abs(dx) > Math.abs(dy)) {
        $("playerImage").src = ASSETS + (dx > 0 ? "playerdireita.png" : "playeresquerda.png");
    } else {
        $("playerImage").src = ASSETS + (dy > 0 ? "playerfrente.png" : "playertras.png");
    }
}

function collides(x, y, sizeOverride) {
    const data = PHASES[game.number];
    const size = sizeOverride || 24;
    for (const w of data.walls) {
        if (x + size > w[0] && x - size < w[0] + w[2] && y + size > w[1] && y - size < w[1] + w[3]) return true;
    }
    for (const b of (data.buildings || [])) {
        if (x + size > b.x && x - size < b.x + b.w && y + size > b.y && y - size < b.y + b.h) return true;
    }
    return false;
}

function enemyCollides(x, y) {
    return collides(x, y, 20) || x < 30 || x > 1770 || y < 30 || y > 1170;
}

function lineBlocked(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (enemyCollides(x1 + dx * t, y1 + dy * t)) return true;
    }
    return false;
}

function moveEnemySimple(enemy, dx, dy, speed, dt) {
    const len = Math.hypot(dx, dy); if (!len) return;
    const sx = (dx / len) * speed * dt / 16;
    const sy = (dy / len) * speed * dt / 16;
    if (!enemyCollides(enemy.x + sx, enemy.y)) enemy.x += sx;
    if (!enemyCollides(enemy.x, enemy.y + sy)) enemy.y += sy;
}

function patrolStep(enemy, cfg, dt) {
    enemy.wanderTimer -= dt;
    if (enemy.wanderTimer <= 0) {
        const dxHome = enemy.homeX - enemy.x, dyHome = enemy.homeY - enemy.y;
        const dHome = Math.hypot(dxHome, dyHome);
        let ax, ay;
        if (dHome > 100) { ax = dxHome; ay = dyHome; }
        else { const a = Math.random() * Math.PI * 2; ax = Math.cos(a); ay = Math.sin(a); }
        const l = Math.hypot(ax, ay) || 1;
        enemy.wanderDir.x = ax / l; enemy.wanderDir.y = ay / l;
        enemy.wanderTimer = 1500 + Math.random() * 1500;
    }
    moveEnemySimple(enemy, enemy.wanderDir.x, enemy.wanderDir.y, cfg.patrolSpeed, dt);
}

function updateEnemies(dt) {
    const cfg = DIFFICULTY[game.number];
    for (const enemy of game.enemies) {
        if (!enemy.alive) continue;
        const dx = game.x - enemy.x, dy = game.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        const canSee = dist < cfg.visionRange && !lineBlocked(enemy.x, enemy.y, game.x, game.y);

        if (canSee) {
            enemy.chasing = true;
            enemy.lastSeenX = game.x; enemy.lastSeenY = game.y;
        }

        if (enemy.chasing && canSee) {
            moveEnemySimple(enemy, dx, dy, cfg.chaseSpeed, dt);
        } else if (enemy.chasing && !canSee) {
            const tx = enemy.lastSeenX, ty = enemy.lastSeenY;
            if (tx == null) enemy.chasing = false;
            else {
                const ddx = tx - enemy.x, ddy = ty - enemy.y;
                if (Math.hypot(ddx, ddy) < 15) { enemy.chasing = false; enemy.lastSeenX = null; enemy.lastSeenY = null; }
                else moveEnemySimple(enemy, ddx, ddy, cfg.chaseSpeed * 0.6, dt);
            }
        } else patrolStep(enemy, cfg, dt);

        if (dist <= 60) {
            enemy.attackTimer += dt;
            if (enemy.attackTimer >= 1000) {
                enemy.attackTimer = 0;
                game.hp = Math.max(1, game.hp - cfg.damage);
            }
        } else enemy.attackTimer = 0;
    }

    if (game.boss && game.boss.alive) {
        const b = game.boss;
        const dxb = game.x - b.x, dyb = game.y - b.y;
        const distb = Math.hypot(dxb, dyb);
        if (distb < 500) {
            b.chasing = true;
            moveEnemySimple(b, dxb, dyb, 1.1, dt);
            if (distb <= 80) {
                b.attackTimer += dt;
                if (b.attackTimer >= 900) {
                    b.attackTimer = 0;
                    game.hp = Math.max(1, game.hp - 8);
                }
            } else b.attackTimer = 0;
        }
    }
}

/* ============================================
   ARMA / ATAQUE
============================================ */
function getWeaponInHand(i) {
    const s = game.hands[i]; if (!s) return null;
    const def = ITEMS[s.type]; if (!def?.weapon) return null;
    return { stack: s, def };
}
function findWeaponInBackpack() {
    for (let i = 0; i < 7; i++) {
        const s = game.backpack[i]; if (!s) continue;
        const def = ITEMS[s.type]; if (def?.weapon) return { index: i, stack: s };
    }
    return null;
}

function attack() {
    if (paused || backpackOpen || dialogOpen || interiorOpen || storyOpen) return;

    let usedHand = activeHand;
    let weapon = getWeaponInHand(usedHand);
    if (!weapon) {
        const other = activeHand === 0 ? 1 : 0;
        weapon = getWeaponInHand(other);
        if (weapon) { usedHand = other; activeHand = other; refreshHandsHud(); }
    }
    if (!weapon) {
        const bw = findWeaponInBackpack();
        if (bw) {
            const old = game.hands[activeHand];
            game.hands[activeHand] = bw.stack;
            game.backpack[bw.index] = old || null;
            usedHand = activeHand;
            weapon = getWeaponInHand(usedHand);
            refreshHandsHud();
        }
    }
    if (!weapon) { flashMessage("Sem arma."); return; }

    const def = weapon.def;
    let usedAmmo = false;
    if (def.ammo) {
        const slot = findInInventories("ammo");
        if (slot) { consumeSlot(slot.where, slot.index); usedAmmo = true; }
    }

    if (game.boss && game.boss.alive) {
        const db = Math.hypot(game.boss.x - game.x, game.boss.y - game.y);
        if (db < 130) {
            let dmg = def.dmg || 1;
            if (def.ammo && !usedAmmo) dmg = 1; else dmg *= 2;
            game.boss.hp -= dmg;
            if (game.boss.hp <= 0) {
                game.boss.alive = false;
                game.bossDefeated = true;
                flashMessage("BOSS DERROTADO!");
            } else {
                flashMessage(`BOSS (mão ${usedHand + 1}) — ${dmg} de dano!`);
            }
            updateHUD(); refreshHandsHud(); saveGame();
            return;
        }
    }

    let target = null, best = 130;
    for (const e of game.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - game.x, e.y - game.y);
        if (d < best) { best = d; target = e; }
    }

    if (target) {
        let dmg = def.dmg || 1;
        if (def.ammo && !usedAmmo) dmg = 1; else dmg *= 2;
        target.hp -= dmg;
        if (target.hp <= 0) target.alive = false;
        target.chasing = true; target.lastSeenX = game.x; target.lastSeenY = game.y;
        flashMessage(`${def.name} (mão ${usedHand + 1}) — acertou!`);
    } else flashMessage(`${def.name} (mão ${usedHand + 1}) — sem alvo.`);

    updateHUD(); refreshHandsHud(); saveGame();
}

/* ============================================
   ITENS NO MAPA
============================================ */
function checkItems() {
    const data = PHASES[game.number];
    data.items.forEach((item, index) => {
        if (game.collected.includes(index)) return;
        if (item[0] === "chest" && game.openedChests.includes(index)) return;
        const d = Math.hypot(item[1] - game.x, item[2] - game.y);
        if (d < 50) {
            if (item[0] === "chest") {
                game.openedChests.push(index);
                giveItem("food", 2); giveItem("ammo", 6); giveItem("bandage", 1); giveItem("coin", 5);
                flashMessage("Baú aberto!");
            } else {
                game.collected.push(index);
                giveItem(item[0], 1);
                flashMessage(`Pegou: ${ITEMS[item[0]]?.name || item[0]}`);
            }
            buildMap(); refreshHandsHud(); updateObjectives();
        }
    });

    data.npcs.forEach((npc) => {
        const d = Math.hypot(npc.x - game.x, npc.y - game.y);
        if (d < 80 && !game.npcsTalked.includes(npc.id)) {
            game.npcsTalked.push(npc.id);
            showDialog(npc.name, npc.text);
            if (npc.name === "Médico") giveItem("medkit", 1);
            if (npc.name === "Sobrevivente") giveItem("food", 1);
            refreshHandsHud(); updateObjectives();
        }
    });
}

function flashMessage(text) {
    const hud = $("hud"); if (!hud) return;
    const box = document.createElement("div");
    box.className = "flashMsg";
    box.textContent = text;
    hud.appendChild(box);
    setTimeout(() => { box.style.opacity = "0"; }, 900);
    setTimeout(() => { box.remove(); }, 1500);
}

function showDialog(name, text) {
    dialogOpen = true;
    $("dialogName").textContent = name;
    $("dialogText").textContent = text;
    $("dialog").classList.remove("hidden");
}

/* ============================================
   INTERIOR
============================================ */
function openInterior() {
    if (!game || dialogOpen || backpackOpen || interiorOpen) return;
    const house = PHASES[game.number].house; if (!house) return;
    interiorOpen = true; paused = true;
    $("interiorTitle").textContent = house.name || "CASA";
    $("interior").classList.remove("hidden");
    renderInterior(house);
}

function renderInterior(house) {
    const room = $("interiorRoom");
    room.innerHTML = "";
    house.items.forEach((itemType, idx) => {
        const key = `${game.number}:${idx}`;
        const taken = game.houseTaken && game.houseTaken.includes(key);
        const el = document.createElement("div");
        el.className = "interiorSlot" + (taken ? " empty" : "");
        el.textContent = taken ? "" : (ITEMS[itemType]?.icon || "?");
        if (!taken) {
            el.onclick = () => {
                giveItem(itemType, 1);
                flashMessage(`Pegou: ${ITEMS[itemType]?.name || itemType}`);
                game.houseTaken = game.houseTaken || [];
                game.houseTaken.push(key);
                renderInterior(house);
                refreshHandsHud(); updateHUD(); saveGame();
            };
        }
        room.appendChild(el);
    });
}

function closeInterior() {
    if (!interiorOpen) return;
    interiorOpen = false; paused = false;
    $("interior").classList.add("hidden");
    lastTime = performance.now();
}

/* ============================================
   SAÍDA
============================================ */
function checkExitInline() {
    const exit = PHASES[game.number].exit;
    const d = Math.hypot(exit.x - game.x, exit.y - game.y);
    if (d > 65) return;
    if (!isExitUnlocked()) {
        if (!checkExitInline._w || Date.now() - checkExitInline._w > 3000) {
            flashMessage("Saída trancada. Complete os objetivos!");
            checkExitInline._w = Date.now();
        }
        return;
    }
    completePhase();
}

/* ============================================
   INVENTÁRIO
============================================ */
function findInInventories(type, minAmount = 1) {
    for (let i = 0; i < 7; i++) { const s = game.backpack[i]; if (s && s.type === type && s.amount >= minAmount) return { where: "backpack", index: i, stack: s }; }
    for (let i = 0; i < 2; i++) { const s = game.hands[i]; if (s && s.type === type && s.amount >= minAmount) return { where: "hands", index: i, stack: s }; }
    return null;
}
function hasItem(t) { return !!findInInventories(t); }
function giveItem(type, amount = 1) {
    const def = ITEMS[type]; if (!def) return false;
    const ms = def.stack || 1;
    for (let i = 0; i < 7; i++) { const s = game.backpack[i]; if (s && s.type === type && s.amount < ms) { const a = Math.min(ms - s.amount, amount); s.amount += a; amount -= a; if (amount <= 0) return true; } }
    for (let i = 0; i < 7; i++) { if (!game.backpack[i]) { const a = Math.min(ms, amount); game.backpack[i] = { id: type, type, amount: a }; amount -= a; if (amount <= 0) return true; } }
    for (let i = 0; i < 2; i++) { if (!game.hands[i]) { const a = Math.min(ms, amount); game.hands[i] = { id: type, type, amount: a }; amount -= a; if (amount <= 0) return true; } }
    return amount === 0;
}
function consumeSlot(where, index) {
    const arr = where === "hands" ? game.hands : game.backpack;
    const s = arr[index]; if (!s) return;
    s.amount--; if (s.amount <= 0) arr[index] = null;
}
function useStack(stack) {
    if (!stack) return;
    const def = ITEMS[stack.type]; if (!def?.consumable) return;
    if (def.effect?.hp) game.hp = Math.min(100, game.hp + def.effect.hp);
    if (def.effect?.hunger) game.hunger = Math.min(100, game.hunger + def.effect.hunger);
}

/* ============================================
   HUD
============================================ */
function updateHUD() {
    if (!game) return;
    $("phaseTitle").textContent = `${game.number} — ${PHASES[game.number].name}`;
    $("hpText").textContent = Math.round(game.hp);
    $("hungerText").textContent = Math.round(game.hunger);
    $("hpBar").style.width = game.hp + "%";
    $("hungerBar").style.width = game.hunger + "%";
    $("foodText").textContent = countItem("food");
    $("medkitText").textContent = countItem("medkit");
}
function countItem(type) {
    let n = 0;
    for (const s of game.backpack) if (s && s.type === type) n += s.amount;
    for (const s of game.hands) if (s && s.type === type) n += s.amount;
    return n;
}
function refreshHandsHud() {
    for (let i = 0; i < 2; i++) {
        const el = $("hand" + i); if (!el) continue;
        el.classList.toggle("active", activeHand === i);
        const s = game.hands[i];
        const ic = el.querySelector(".handIcon"), nm = el.querySelector(".handName");
        if (s) { ic.textContent = ITEMS[s.type]?.icon || "?"; if (nm) nm.textContent = ITEMS[s.type]?.name || s.type; }
        else { ic.textContent = "—"; if (nm) nm.textContent = "vazio"; }
    }
}

/* ============================================
   RENDER
============================================ */
function render() {
    if (!game) return;

    $("player").style.left = game.x + "px";
    $("player").style.top = game.y + "px";

    document.querySelectorAll(".enemy").forEach((el) => {
        const id = Number(el.dataset.id);
        const e = game.enemies[id];
        if (!e || !e.alive) { el.style.display = "none"; return; }
        el.style.display = "block";
        el.style.left = e.x + "px";
        el.style.top = e.y + "px";
        const bar = el.querySelector(".enemyHealth div");
        if (bar) bar.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + "%";
        const img = el.querySelector("img");
        if (Math.abs(game.x - e.x) > Math.abs(game.y - e.y)) {
            img.src = ASSETS + (game.x > e.x ? "enemydireita.png" : "enemyesquerda.png");
        } else {
            img.src = ASSETS + (game.y > e.y ? "enemyfrente.png" : "enemytras.png");
        }
        el.style.filter = e.chasing
            ? "drop-shadow(0 0 12px #ff2d2d) drop-shadow(0 6px 6px #000c)"
            : "drop-shadow(0 6px 6px #000c)";
    });

    const bossEl = $("bossEl");
    if (bossEl && game.boss && game.boss.alive) {
        bossEl.style.left = game.boss.x + "px";
        bossEl.style.top = game.boss.y + "px";
        const bar = bossEl.querySelector(".enemyHealth div");
        if (bar) bar.style.width = Math.max(0, (game.boss.hp / game.boss.maxHp) * 100) + "%";
    } else if (bossEl) {
        bossEl.style.display = "none";
    }

    const ZOOM = 1.5;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const worldW = 1800 * ZOOM;
    const worldH = 1200 * ZOOM;

    let camX = Math.round(vw / 2 - game.x * ZOOM);
    let camY = Math.round(vh / 2 - game.y * ZOOM);

    if (worldW <= vw) camX = Math.round((vw - worldW) / 2);
    else {
        const minX = vw - worldW;
        if (camX > 0) camX = 0;
        if (camX < minX) camX = minX;
    }
    if (worldH <= vh) camY = Math.round((vh - worldH) / 2);
    else {
        const minY = vh - worldH;
        if (camY > 0) camY = 0;
        if (camY < minY) camY = minY;
    }

    const world = $("world");
    world.style.left = "0px";
    world.style.top = "0px";
    world.style.transform = `translate(${camX}px, ${camY}px) scale(${ZOOM})`;

    checkExitInline();
}

/* ============================================
   MOCHILA UI
============================================ */
function toggleBackpack() {
    if (paused || !game || dialogOpen || interiorOpen || storyOpen) return;
    backpackOpen = !backpackOpen;
    $("backpack").classList.toggle("hidden", !backpackOpen);
    if (backpackOpen) { selectedSlot = null; refreshInventoryUI(); }
}
function refreshInventoryUI() {
    const handsEl = $("handsSlots");
    handsEl.innerHTML = "";
    for (let i = 0; i < 2; i++) handsEl.appendChild(makeSlotEl("hands", i, game.hands[i]));
    const bagEl = $("backpackSlots");
    bagEl.innerHTML = "";
    for (let i = 0; i < 7; i++) bagEl.appendChild(makeSlotEl("backpack", i, game.backpack[i]));
}
function makeSlotEl(where, index, stack) {
    const el = document.createElement("div");
    el.className = "slot";
    if (selectedSlot && selectedSlot.where === where && selectedSlot.index === index) el.classList.add("selected");
    if (stack) {
        el.innerHTML = `<span>${ITEMS[stack.type]?.icon || "?"}</span>`;
        if (stack.amount > 1) {
            const a = document.createElement("span");
            a.className = "amt"; a.textContent = stack.amount;
            el.appendChild(a);
        }
    }
    el.onclick = () => onSlotClick(where, index);
    return el;
}
function onSlotClick(where, index) {
    const arr = where === "hands" ? game.hands : game.backpack;
    const stack = arr[index];
    if (!selectedSlot) { if (!stack) return; selectedSlot = { where, index }; refreshInventoryUI(); return; }
    if (selectedSlot.where === where && selectedSlot.index === index) { selectedSlot = null; refreshInventoryUI(); return; }
    const srcArr = selectedSlot.where === "hands" ? game.hands : game.backpack;
    const dstArr = arr;
    const a = srcArr[selectedSlot.index], b = dstArr[index];
    if (a && b && a.type === b.type) {
        const ms = ITEMS[a.type]?.stack || 1;
        const add = Math.min(ms - b.amount, a.amount);
        b.amount += add; a.amount -= add;
        if (a.amount <= 0) srcArr[selectedSlot.index] = null;
    } else { srcArr[selectedSlot.index] = b; dstArr[index] = a; }
    selectedSlot = null;
    refreshInventoryUI(); refreshHandsHud(); updateHUD(); updateObjectives(); saveGame();
}
function dropSelected() {
    if (!selectedSlot) return flashMessage("Selecione um item primeiro.");
    const arr = selectedSlot.where === "hands" ? game.hands : game.backpack;
    const stack = arr[selectedSlot.index]; if (!stack) return;
    const name = ITEMS[stack.type]?.name || stack.type;
    arr[selectedSlot.index] = null;
    selectedSlot = null;
    refreshInventoryUI(); refreshHandsHud(); updateHUD(); updateObjectives();
    flashMessage(`Jogou fora: ${name}`);
    saveGame();
}

/* ============================================
   COMER / CURAR
============================================ */
function quickEat() {
    if (!game || storyOpen) return;
    if (game.hunger >= 100) return flashMessage("Sem fome.");
    const s = findInInventories("food"); if (!s) return flashMessage("Sem comida.");
    useStack(s.stack); consumeSlot(s.where, s.index);
    refreshHandsHud(); updateHUD(); saveGame();
}
function quickHeal() {
    if (!game || storyOpen) return;
    if (game.hp >= 100) return flashMessage("Vida cheia.");
    const s = findInInventories("medkit") || findInInventories("bandage");
    if (!s) return flashMessage("Sem kit médico.");
    useStack(s.stack); consumeSlot(s.where, s.index);
    refreshHandsHud(); updateHUD(); saveGame();
}

/* ============================================
   PAUSA / SALVAR
============================================ */
function togglePause() {
    if (!game || backpackOpen || dialogOpen || interiorOpen || storyOpen) return;
    paused = !paused;
    $("pauseMenu").classList.toggle("hidden", !paused);
    if (paused) saveGame();
}

async function saveGame() {
    if (!game || !authToken) return;
    try {
        await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + authToken },
            body: JSON.stringify({
                phase: game.number, x: game.x, y: game.y, hp: game.hp, hunger: game.hunger,
                hands: game.hands, backpack: game.backpack, collected: game.collected,
                openedChests: game.openedChests, npcsTalked: game.npcsTalked,
                houseTaken: game.houseTaken || [],
                bossDefeated: game.bossDefeated || false,
                completed: !!currentUser?.phases?.[game.number]?.completed,
            }),
        });
    } catch (e) { console.log("Erro ao salvar:", e); }
}

async function completePhase() {
    if (!gameRunning) return;
    gameRunning = false;
    if (!currentUser.phases[game.number]) currentUser.phases[game.number] = {};
    currentUser.phases[game.number].completed = true;
    currentUser.phases[game.number].unlocked = true;
    if (game.number < 10) {
        if (!currentUser.phases[game.number + 1]) currentUser.phases[game.number + 1] = {};
        currentUser.phases[game.number + 1].unlocked = true;
        if (currentUser.unlockedPhase < game.number + 1) currentUser.unlockedPhase = game.number + 1;
    }
    await saveGame();
    await loadUser();
    $("complete").classList.remove("hidden");
    $("completeText").textContent = game.number === 10
        ? "VOCÊ VENCEU O ZERA: BEYOND!"
        : `${PHASES[game.number].name} concluída!`;
    if (game.number >= 10) $("nextPhaseButton").classList.add("hidden");
    else $("nextPhaseButton").classList.remove("hidden");
}

function stopGame() {
    gameRunning = false; game = null;
    paused = false; backpackOpen = false; dialogOpen = false;
    interiorOpen = false; storyOpen = false;
    const dg = $("danger"); if (dg) dg.classList.remove("on");
}
async function returnMenu() {
    if (game) await saveGame();
    stopGame();
    $("gameScreen").classList.add("hidden");
    $("complete").classList.add("hidden");
    $("pauseMenu").classList.add("hidden");
    $("backpack").classList.add("hidden");
    $("dialog").classList.add("hidden");
    $("interior").classList.add("hidden");
    $("story").classList.add("hidden");
    $("menuScreen").classList.remove("hidden");
    await loadUser();
    renderPhases();
}

/* ============================================
   BOTÕES
============================================ */
function bindUI() {
    const bind = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };

    bind("loginButton", login);
    bind("registerButton", register);
    bind("logoutButton", async () => {
        await saveGame();
        try { await fetch("/api/logout", { method: "POST", headers: { Authorization: "Bearer " + authToken } }); } catch { }
        authToken = null; currentUser = null;
        localStorage.removeItem("newzera_token");
        stopGame();
        $("menuScreen").classList.add("hidden");
        $("gameScreen").classList.add("hidden");
        $("loginScreen").classList.remove("hidden");
        $("loginPassword").value = "";
        message("");
    });
    bind("backpackButton", toggleBackpack);
    bind("closeBag", toggleBackpack);
    bind("pauseButton", togglePause);
    bind("continueButton", togglePause);
    bind("saveButton", saveGame);
    bind("backMenuButton", returnMenu);
    bind("completeMenuButton", returnMenu);
    bind("storyStart", closeStory);
    bind("nextPhaseButton", () => {
        if (game && game.number < 10) {
            const next = game.number + 1;
            $("complete").classList.add("hidden");
            window.startPhase(next, false);
        }
    });
    bind("interiorLeave", closeInterior);
    bind("dialogClose", () => { dialogOpen = false; $("dialog").classList.add("hidden"); });
    bind("useSelectedButton", () => {
        if (!selectedSlot) return;
        const arr = selectedSlot.where === "hands" ? game.hands : game.backpack;
        const stack = arr[selectedSlot.index]; if (!stack) return;
        const def = ITEMS[stack.type]; if (!def?.consumable) return;
        useStack(stack); consumeSlot(selectedSlot.where, selectedSlot.index);
        selectedSlot = null;
        refreshInventoryUI(); refreshHandsHud(); updateHUD(); saveGame();
    });
    bind("dropSelectedButton", dropSelected);

    const pass = $("loginPassword");
    if (pass) pass.addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
}

/* ============================================
   TECLADO
============================================ */
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!gameRunning) return;
    if (e.key === "1") { activeHand = 0; refreshHandsHud(); return; }
    if (e.key === "2") { activeHand = 1; refreshHandsHud(); return; }
    if (e.key === " ") { e.preventDefault(); attack(); }
    if (e.key.toLowerCase() === "f") quickEat();
    if (e.key.toLowerCase() === "r") quickHeal();
    if (e.key.toLowerCase() === "q") toggleBackpack();
    if (e.key.toLowerCase() === "e") {
        if (interiorOpen) { closeInterior(); return; }
        if (game && gameRunning && !backpackOpen && !dialogOpen) {
            const house = PHASES[game.number].house;
            if (house) {
                const d = Math.hypot(house.x - game.x, house.y - game.y);
                if (d < 90) { openInterior(); return; }
            }
        }
    }
    if (e.key === "Delete" && backpackOpen && selectedSlot) { e.preventDefault(); dropSelected(); return; }
    if (e.key === "Escape") {
        if (storyOpen) { closeStory(); return; }
        if (interiorOpen) { closeInterior(); return; }
        if (backpackOpen) toggleBackpack();
        else if (dialogOpen) { dialogOpen = false; $("dialog").classList.add("hidden"); }
        else togglePause();
    }
});
window.addEventListener("keyup", (e) => { keys[e.key] = false; });

document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (game) saveGame(); paused = true; }
    else if (gameRunning) lastTime = performance.now();
});
window.addEventListener("beforeunload", () => { if (game) saveGame(); });
window.addEventListener("resize", () => { if (game) render(); });

window.addEventListener("error", (e) => console.error("[GLOBAL ERROR]", e.message, e.filename, e.lineno));
window.addEventListener("unhandledrejection", (e) => console.error("[UNHANDLED PROMISE]", e.reason));

/* ============================================
   INÍCIO
============================================ */
bindUI();
preload();