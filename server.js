const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 1. GARANTIR QUE A PASTA "videos" EXISTE
// ------------------------------------------------------------
const videosFolder = path.join(__dirname, "videos");
if (!fs.existsSync(videosFolder)) {
    fs.mkdirSync(videosFolder);
    console.log("Pasta 'videos' criada.");
}

// ------------------------------------------------------------
// 2. CONFIGURAÇÃO DO MULTER (salva os vídeos na pasta /videos)
// ------------------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "videos/"),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.floor(Math.random() * 99999);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});

const upload = multer({ storage });

// ------------------------------------------------------------
// 3. SERVE ARQUIVOS ESTÁTICOS DO FRONT
// ------------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/videos", express.static(path.join(__dirname, "videos")));

// ------------------------------------------------------------
// 4. LEITURA E SALVAMENTO DO videos.json
// ------------------------------------------------------------
const jsonPath = path.join(__dirname, "videos.json");

function loadJSON() {
    try {
        const data = fs.readFileSync(jsonPath, "utf8");
        const parsed = JSON.parse(data);

        // Se não existir o array "videos", cria
        if (!Array.isArray(parsed.videos)) {
            return { videos: [] };
        }

        return parsed;
    } catch {
        return { videos: [] };
    }
}

function saveJSON(data) {
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
}

// ------------------------------------------------------------
// 5. ROTA DE UPLOAD
// ------------------------------------------------------------
app.post("/upload", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    const videosData = loadJSON();

    const newVideo = {
        id: Date.now(),
        title: req.body.title || "Sem título",
        filename: req.file.filename,
        path: "/videos/" + req.file.filename
    };

    videosData.videos.push(newVideo);
    saveJSON(videosData);

    res.json({ success: true, video: newVideo });
});

// ------------------------------------------------------------
// 6. ROTA PARA LISTAR VÍDEOS
// ------------------------------------------------------------
app.get("/api/videos", (req, res) => {
    const videosData = loadJSON();
    res.json(videosData.videos);
});

// ------------------------------------------------------------
// 7. ROTA PARA PEGAR UM VÍDEO ESPECÍFICO
// ------------------------------------------------------------
app.get("/api/video/:id", (req, res) => {
    const videosData = loadJSON();
    const video = videosData.videos.find(v => v.id == req.params.id);

    if (!video) return res.status(404).json({ error: "Vídeo não encontrado" });
    res.json(video);
});

// ------------------------------------------------------------
// 8. INICIA O SERVIDOR (Render usa process.env.PORT)
// ------------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🔥 Server rodando na porta " + PORT));
