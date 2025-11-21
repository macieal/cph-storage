const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/videos", express.static("videos"));

if (!fs.existsSync("videos")) fs.mkdirSync("videos");

let videosData = [];
const DATA_FILE = "videos.json";

if (fs.existsSync(DATA_FILE)) {
    videosData = JSON.parse(fs.readFileSync(DATA_FILE));
}

const storage = multer.diskStorage({
    destination: "videos",
    filename: (req, file, cb) => {
        const name = Date.now() + path.extname(file.originalname);
        cb(null, name);
    }
});

const upload = multer({ storage });

app.post("/upload", upload.single("video"), (req, res) => {
    const newVideo = {
        id: Date.now(),
        filename: req.file.filename
    };

    videosData.push(newVideo);
    fs.writeFileSync(DATA_FILE, JSON.stringify(videosData, null, 2));

    res.json({ success: true });
});

app.get("/list", (req, res) => {
    res.json(videosData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server on port " + PORT));