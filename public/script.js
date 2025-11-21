// ====== LISTAR VIDEOS NA PÁGINA INICIAL ======
async function loadVideos() {
    const list = document.getElementById("videoList");
    if (!list) return;

    const res = await fetch("/videos");
    const data = await res.json();

    list.innerHTML = "";

    data.videos.forEach(v => {
        const item = document.createElement("div");
        item.className = "video-item";
        item.innerHTML = `
            <h3>${v.title}</h3>
            <video src="${v.url}" width="300" controls></video>
            <br>
            <button onclick="watch('${v.id}')">Assistir</button>
        `;
        list.appendChild(item);
    });
}

// ====== FUNÇÃO ABRIR PÁGINA DO VÍDEO ======
function watch(id) {
    window.location.href = `/watch.html?id=${id}`;
}

// ====== CARREGAR VÍDEO NA PÁGINA WATCH ======
async function loadWatchPage() {
    const videoPlayer = document.getElementById("videoPlayer");
    const title = document.getElementById("videoTitle");

    if (!videoPlayer || !title) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const res = await fetch("/videos");
    const data = await res.json();
    const video = data.videos.find(v => v.id === id);

    if (!video) {
        title.textContent = "Vídeo não encontrado :(";
        return;
    }

    title.textContent = video.title;
    videoPlayer.src = video.url;
}

// ====== UPLOAD DE VÍDEO ======
async function uploadVideo() {
    const titleInput = document.getElementById("title");
    const fileInput = document.getElementById("file");

    if (!titleInput.value || !fileInput.files.length) {
        alert("Preencha tudo!");
        return;
    }

    const form = new FormData();
    form.append("title", titleInput.value);
    form.append("file", fileInput.files[0]);

    const res = await fetch("/upload", {
        method: "POST",
        body: form
    });

    const data = await res.json();

    if (data.success) {
        alert("Vídeo enviado com sucesso!");
        window.location.href = "/";
    } else {
        alert("Erro ao enviar vídeo");
        console.log(data);
    }
}

// Carregar listas automaticamente (quando existir)
window.onload = () => {
    loadVideos();
    loadWatchPage();
};