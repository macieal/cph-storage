const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// permitir acesso
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// servir arquivos estáticos
app.use(express.static("public"));

// pasta onde os vídeos vão ficar
const uploadFolder = path.join(__dirname, "videos");

// garantir que exista
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// configurar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "videos"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.floor(Math.random() * 999999);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

// rota para listar vídeos
app.get("/api/videos", (req, res) => {
  fs.readFile("videos.json", "utf8", (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

// rota para upload
app.post("/api/upload", upload.single("video"), (req, res) => {
  const { title } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

  // salvar no videos.json
  const newVideo = {
    id: Date.now(),
    title: title || "Sem título",
    filename: "/videos/" + file.filename
  };

  let current = [];
  try {
    current = JSON.parse(fs.readFileSync("videos.json", "utf8"));
  } catch {}

  current.push(newVideo);

  fs.writeFileSync("videos.json", JSON.stringify(current, null, 2));

  res.json({ success: true, video: newVideo });
});

// servir arquivos da pasta videos
app.use("/videos", express.static("videos"));

// iniciar servidor
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});