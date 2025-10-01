// ========== IMPORT FIREBASE ==========
import { auth, provider, db } from "./firebase.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// ========== ELEMENTS ==========
const audioPlayer = document.getElementById("audio-player");
const youtubePlayerDiv = document.getElementById("youtube-player");
const nowPlaying = document.getElementById("now-playing");
const playlistSelect = document.getElementById("playlist-select");
const toggleBtn = document.getElementById("toggle-btn");
const musicBar = document.getElementById("music-player");

let user = null;
let playlists = {};          // Local + Firestore
let currentPlaylist = null;  // Which playlist is active
let spotifyToken = localStorage.getItem("spotify_token") || null;
let youtubeToken = localStorage.getItem("youtube_token") || null;

// ========== TOGGLE MINIMIZE ==========
toggleBtn.addEventListener("click", () => {
  musicBar.classList.toggle("minimized");
  toggleBtn.textContent = musicBar.classList.contains("minimized") ? "+" : "–";

  // hide embeds + audio if minimized
  if (musicBar.classList.contains("minimized")) {
    audioPlayer.pause();
    youtubePlayerDiv.style.display = "none";
    audioPlayer.style.display = "none";
  } else {
    if (currentPlaylist && playlists[currentPlaylist]?.source === "youtube") {
      youtubePlayerDiv.style.display = "block";
    } else if (currentPlaylist && playlists[currentPlaylist]?.source === "spotify") {
      youtubePlayerDiv.style.display = "block";
    } else {
      audioPlayer.style.display = "block";
    }
  }
});

// ========== GOOGLE LOGIN ==========
document.getElementById("login-youtube").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    user = result.user;
    youtubeToken = result.credential?.accessToken;
    if (youtubeToken) {
      localStorage.setItem("youtube_token", youtubeToken);
      await fetchYouTubePlaylists(youtubeToken);
    }
    console.log("Signed in:", user.displayName);
    await loadUserPlaylists();
  } catch (error) {
    console.error("Login failed:", error);
  }
});

// ========== FIRESTORE PLAYLIST STORAGE ==========
async function loadUserPlaylists() {
  if (!user) return;
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      playlists = { ...playlists, ...snap.data().playlists || {} };
    } else {
      playlists["My Playlist"] = [];
      await setDoc(ref, { playlists });
    }
    updatePlaylistSelect();
  } catch (error) {
    console.error("Failed to load user playlists:", error);
  }
}

async function savePlaylists() {
  if (!user) return;
  try {
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { playlists });
  } catch (error) {
    console.error("Failed to save playlists:", error);
  }
}

// ========== LOCAL FALLBACK ==========
if (!user) {
  playlists = JSON.parse(localStorage.getItem("guest_playlists") || "{}") || { "My Playlist": [] };
  updatePlaylistSelect();
}

function saveGuestPlaylists() {
  if (!user) localStorage.setItem("guest_playlists", JSON.stringify(playlists));
}

// ========== PLAYLIST DROPDOWN ==========
function updatePlaylistSelect() {
  playlistSelect.innerHTML = "";
  for (let name in playlists) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    playlistSelect.appendChild(opt);
  }
  if (!currentPlaylist && Object.keys(playlists).length > 0) {
    currentPlaylist = Object.keys(playlists)[0];
  }
  if (currentPlaylist) {
    playlistSelect.value = currentPlaylist;
  }
}

// ========== PLAYLIST SELECTION ==========
playlistSelect.addEventListener("change", () => {
  currentPlaylist = playlistSelect.value;
  const playlist = playlists[currentPlaylist];
  if (playlist && playlist.length > 0) {
    playTrack(playlist[0]);
  }
});

// ========== NEW PLAYLIST ==========
document.getElementById("new-playlist").addEventListener("click", () => {
  const name = prompt("Enter new playlist name:");
  if (name && !playlists[name]) {
    playlists[name] = [];
    updatePlaylistSelect();
    currentPlaylist = name;
    if (user) {
      savePlaylists();
    } else {
      saveGuestPlaylists();
    }
  }
});

// ========== UPLOAD SONGS ==========
document.getElementById("upload-btn").addEventListener("click", () => {
  if (!currentPlaylist) {
    alert("Please create a playlist first!");
    return;
  }
  
  let input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*";
  input.multiple = true;
  input.onchange = (e) => {
    for (let file of e.target.files) {
      playlists[currentPlaylist].push({ 
        type: "local", 
        name: file.name, 
        url: URL.createObjectURL(file) 
      });
    }
    if (user) {
      savePlaylists();
    } else {
      saveGuestPlaylists();
    }
    if (playlists[currentPlaylist].length === e.target.files.length) {
      playTrack(playlists[currentPlaylist][0]);
    }
  };
  input.click();
});

// ========== SEARCH MUSIC ==========
document.getElementById("search-btn").addEventListener("click", async () => {
  const query = document.getElementById("music-search").value.trim();
  if (!query) return;

  // If YouTube link → embed
  if (query.includes("youtube.com") || query.includes("youtu.be")) {
    const track = { type: "youtube", url: query, name: "YouTube Video" };
    playTrack(track);
    addToCurrentPlaylist(track);
    return;
  }

  // If Spotify link → embed
  if (query.includes("spotify.com")) {
    const track = { type: "spotify", url: query, name: "Spotify Track" };
    playTrack(track);
    addToCurrentPlaylist(track);
    return;
  }

  alert("Enter a YouTube or Spotify link, or connect APIs for text search!");
});

function addToCurrentPlaylist(track) {
  if (!currentPlaylist) return;
  playlists[currentPlaylist].push(track);
  if (user) {
    savePlaylists();
  } else {
    saveGuestPlaylists();
  }
}

// ========== PLAY TRACK ==========
function playTrack(track) {
  cleanup();

  if (!track) {
    nowPlaying.textContent = "Now Playing: None";
    return;
  }
  
  nowPlaying.textContent = "Now Playing: " + track.name;

  if (track.type === "local") {
    audioPlayer.src = track.url;
    audioPlayer.style.display = "block";
    youtubePlayerDiv.style.display = "none";
    audioPlayer.play().catch(e => console.log("Audio play failed:", e));
  }

  if (track.type === "youtube") {
    const vidId = extractYouTubeId(track.url);
    if (vidId) {
      youtubePlayerDiv.innerHTML = `<iframe width="300" height="150"
        src="https://www.youtube.com/embed/${vidId}?autoplay=1"
        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      youtubePlayerDiv.style.display = "block";
      audioPlayer.style.display = "none";
    }
  }

  if (track.type === "spotify") {
    let embedUrl = track.url.replace("open.spotify.com", "open.spotify.com/embed");
    youtubePlayerDiv.innerHTML = `<iframe src="${embedUrl}" width="300" height="150" frameborder="0"
      allow="autoplay; encrypted-media"></iframe>`;
    youtubePlayerDiv.style.display = "block";
    audioPlayer.style.display = "none";
  }
}

function cleanup() {
  youtubePlayerDiv.innerHTML = "";
  youtubePlayerDiv.style.display = "none";
  audioPlayer.pause();
  audioPlayer.src = "";
  audioPlayer.style.display = "none";
}

// ========== YOUTUBE HELPERS ==========
function extractYouTubeId(url) {
  let reg = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]+)/;
  let match = url.match(reg);
  return match ? match[1] : null;
}

// ========== SPOTIFY LOGIN ==========
document.getElementById("login-spotify").addEventListener("click", () => {
  const clientId = "YOUR_SPOTIFY_CLIENT_ID"; // Replace with your Spotify Client ID
  const redirectUri = encodeURIComponent(window.location.origin);
  const scope = encodeURIComponent("playlist-read-private user-library-read");
  
  window.location.href = 
    `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}`;
});

// Handle Spotify OAuth return
if (window.location.hash.includes("access_token")) {
  spotifyToken = new URLSearchParams(window.location.hash.substring(1)).get("access_token");
  localStorage.setItem("spotify_token", spotifyToken);
  fetchSpotifyPlaylists();
  // Clean URL
  window.history.replaceState({}, document.title, window.location.pathname);
}

async function fetchSpotifyPlaylists() {
  if (!spotifyToken) return;
  try {
    const res = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: "Bearer " + spotifyToken }
    });
    const data = await res.json();
    console.log("Spotify playlists:", data);
    
    if (data.items) {
      data.items.forEach(pl => {
        playlists[`🎵 ${pl.name}`] = { 
          source: "spotify", 
          url: pl.external_urls.spotify,
          type: "spotify",
          name: pl.name
        };
      });
      updatePlaylistSelect();
    }
  } catch (error) {
    console.error("Failed to fetch Spotify playlists:", error);
  }
}

// ========== YOUTUBE PLAYLISTS ==========
async function fetchYouTubePlaylists(token) {
  if (!token) return;
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&key=YOUR_YOUTUBE_API_KEY`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("YouTube playlists:", data);
    
    if (data.items) {
      data.items.forEach(pl => {
        playlists[`📺 ${pl.snippet.title}`] = { 
          source: "youtube", 
          url: `https://www.youtube.com/playlist?list=${pl.id}`,
          type: "youtube",
          name: pl.snippet.title
        };
      });
      updatePlaylistSelect();
    }
  } catch (error) {
    console.error("Failed to fetch YouTube playlists:", error);
  }
}

// ========== AUTO-INITIALIZE ==========
window.addEventListener('load', () => {
  // Auto-load saved tokens and playlists
  if (spotifyToken) {
    fetchSpotifyPlaylists();
  }
  if (youtubeToken) {
    fetchYouTubePlaylists(youtubeToken);
  }
});