import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const videosFile = "videos.json";
const videosFolder = "videos";

if (!fs.existsSync(videosFile)) fs.writeFileSync(videosFile, "[]");
if (!fs.existsSync(videosFolder)) fs.mkdirSync(videosFolder);

// CONFIG DO MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "videos"),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 9999);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// 🔵 LISTAR VÍDEOS
app.get("/api/videos", (req, res) => {
    const data = JSON.parse(fs.readFileSync(videosFile));
    res.json(data);
});

// 🔵 ENVIAR VÍDEO
app.post("/api/upload", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum vídeo enviado!" });

    const data = JSON.parse(fs.readFileSync(videosFile));
    const video = {
        id: Date.now(),
        filename: req.file.filename
    };

    data.push(video);
    fs.writeFileSync(videosFile, JSON.stringify(data, null, 2));

    res.json({ message: "Upload concluído!", video });
});

// 🔵 STREAMING DO VÍDEO
app.get("/video/:name", (req, res) => {
    const filePath = path.join("videos", req.params.name);

    if (!fs.existsSync(filePath)) return res.status(404).send("Vídeo não encontrado");

    res.sendFile(path.resolve(filePath));
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));