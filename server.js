const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "temp/" });

// ====== ENV VARS (Render) ======
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;   // "macieal"
const GITHUB_REPO = process.env.GITHUB_REPO;   // "macieal/cph-storege"

if (!GITHUB_TOKEN || !GITHUB_USER || !GITHUB_REPO) {
    console.error("❌ ERRO: Variáveis GITHUB_TOKEN, GITHUB_USER, GITHUB_REPO não configuradas!");
}

// ====== Carrega lista de vídeos ======
function loadVideos() {
    try {
        return JSON.parse(fs.readFileSync("videos.json"));
    } catch (err) {
        return { videos: [] };
    }
}

// ====== Salva lista ======
function saveVideos(data) {
    fs.writeFileSync("videos.json", JSON.stringify(data, null, 2));
}

// ====== Cria Release no GitHub (se não existir) ======
async function ensureRelease() {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/videos`;

    try {
        const res = await axios.get(url, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        return res.data.id; // Release já existe
    } catch (err) {
        // Release não existe → criar
        const res = await axios.post(
            `https://api.github.com/repos/${GITHUB_REPO}/releases`,
            {
                tag_name: "videos",
                name: "Videos Storage"
            },
            {
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            }
        );

        return res.data.id;
    }
}

// ====== Função de upload para o GitHub ======
async function uploadToGitHub(filePath, fileName) {
    const releaseId = await ensureRelease();

    const content = fs.readFileSync(filePath);

    const url = `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${releaseId}/assets?name=${fileName}`;

    const res = await axios.post(url, content, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/octet-stream"
        }
    });

    return res.data.browser_download_url; // link permanente
}

// ====== Rota para listar vídeos ======
app.get("/videos", (req, res) => {
    res.json(loadVideos());
});

// ====== Rota de upload ======
app.post("/upload", upload.single("file"), async (req, res) => {
    const title = req.body.title;
    const file = req.file;

    if (!title || !file) {
        return res.json({ success: false, error: "Título ou arquivo faltando." });
    }

    try {
        const githubURL = await uploadToGitHub(file.path, file.originalname);

        const data = loadVideos();

        const id = Date.now().toString();

        data.videos.push({
            id,
            title,
            url: githubURL,
            created_at: new Date().toISOString()
        });

        saveVideos(data);

        fs.unlinkSync(file.path);

        res.json({ success: true, url: githubURL });

    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message });
    }
});

// ====== INICIAR ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});