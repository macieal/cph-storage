async function loadVideos() {
    const list = document.getElementById("list");
    const res = await fetch("/api/videos");
    const videos = await res.json();

    list.innerHTML = videos
        .map(v => `
            <div>
                <a href="watch.html?v=${v.filename}">
                    Vídeo ${v.id}
                </a>
            </div>
        `)
        .join("");
}

if (location.pathname.endsWith("index.html")) {
    loadVideos();
}