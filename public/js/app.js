/*****  (A) Search functionality for static game grid  *****/

const GAMES = [
  { id:'riddles',   name:'Brain Riddles',  desc:'Classic riddles & teasers' },
  { id:'trivia',    name:'Trivia',         desc:'Multiple choice trivia' },
  { id:'emoji',     name:'Emoji Guess',    desc:'Decode emoji phrases' },
  { id:'word',      name:'Word Game',      desc:'Guess the hidden word' },
  { id:'chess',     name:'Chess',          desc:'Play chess against AI' },
  { id:'connect4',  name:'Connect 4',      desc:'Classic connect four' },
  { id:'imposter',  name:'Imposter',       desc:'Find the imposter!' },
  { id:'school',    name:'School Trivia',  desc:'Educational quick quizzes' },
];

const search = document.getElementById('search');
const gameCards = document.querySelectorAll('.game-card');

// Search functionality
search.addEventListener('input', e => {
  const query = e.target.value.toLowerCase();
  gameCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const shouldShow = text.includes(query) || query === '';
    card.style.display = shouldShow ? 'block' : 'none';
  });
});

/*****  (B) Audio playlists (localStorage + external links or uploads)  *****/

const playlistSel = document.getElementById('playlistSel');
const newPlaylistBtn = document.getElementById('newPlaylistBtn');
const uploadBtn = document.getElementById('uploadBtn');
const linkInput = document.getElementById('linkInput');
const addLinkBtn = document.getElementById('addLinkBtn');
const nowPlaying = document.getElementById('nowPlaying');

let playlists = JSON.parse(localStorage.getItem('evol.playlists') || '{}'); // {name: [tracks]}
let current = localStorage.getItem('evol.currentPlaylist') || '';

function saveLists(){ localStorage.setItem('evol.playlists', JSON.stringify(playlists)); }

function refreshPlaylists(){
  playlistSel.innerHTML = '';
  Object.keys(playlists).forEach(name=>{
    const o = document.createElement('option');
    o.value = name; o.textContent = name;
    playlistSel.appendChild(o);
  });
  if (!current && Object.keys(playlists).length) current = Object.keys(playlists)[0];
  if (current) playlistSel.value = current;
}
refreshPlaylists();

playlistSel.onchange = () => {
  current = playlistSel.value;
  localStorage.setItem('evol.currentPlaylist', current);
};

newPlaylistBtn.onclick = () => {
  const name = prompt('Playlist name?')?.trim();
  if (!name) return;
  if (!playlists[name]) playlists[name] = [];
  current = name;
  saveLists(); refreshPlaylists();
};

uploadBtn.onclick = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';
  input.multiple = true;
  input.onchange = () => {
    const files = [...input.files];
    if (!files.length) return;
    if (!current) { alert('Create a playlist first.'); return; }
    files.forEach(f => {
      const url = URL.createObjectURL(f);
      playlists[current].push({ title: f.name, url, type:'file' });
    });
    saveLists();
    alert(`Added ${files.length} track(s) to "${current}".`);
  };
  input.click();
};

addLinkBtn.onclick = () => {
  const link = linkInput.value.trim();
  if (!link) return;
  if (!current) { alert('Create a playlist first.'); return; }

  // Naive support: store as-is. If YouTube/Spotify, open in new tab on click (we can't stream directly without their SDKs/permissions).
  const title = link.split('/').pop().slice(0,60);
  playlists[current].push({ title, url: link, type:'link' });
  saveLists(); linkInput.value = '';
  alert(`Added link to "${current}".`);
};

// Simple local playback for file uploads only
const audio = new Audio();
audio.addEventListener('ended', ()=> nowPlaying.textContent = 'Now Playing: None');

function playFirstLocal(){
  const list = playlists[current] || [];
  const t = list.find(x => x.type === 'file');
  if (!t) { alert('No uploaded audio in this playlist. Use Upload.'); return; }
  audio.src = t.url; audio.play();
  nowPlaying.textContent = `Now Playing: ${t.title}`;
}
nowPlaying.onclick = playFirstLocal;

/*****  (C) OPTIONAL Firebase Auth + Firestore Leaderboard *****/
/** If you don't want login/leaderboard yet, you can delete everything below this line. **/

// 1) Put your Firebase web config here if you enable it:
const FIREBASE = {
  enabled: false,     // set true when you're ready
  config: {
    apiKey:        "YOUR_API_KEY",
    authDomain:    "YOUR_AUTH_DOMAIN",
    projectId:     "YOUR_PROJECT_ID",
    storageBucket: "YOUR_BUCKET",
    appId:         "YOUR_APP_ID",
  }
};

const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

let auth, db, user = null;

async function initFirebase(){
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js');
  const { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } =
    await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js');
  const { getFirestore, collection, query, orderBy, limit, getDocs } =
    await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js');

  const app = initializeApp(FIREBASE.config);
  auth = getAuth(app);
  db   = getFirestore(app);

  const provider = new GoogleAuthProvider();

  loginBtn.onclick = () => signInWithPopup(auth, provider);
  logoutBtn.onclick = () => signOut(auth);

  onAuthStateChanged(auth, async (u) => {
    user = u || null;
    loginBtn.style.display  = user ? 'none':'inline-block';
    logoutBtn.style.display = user ? 'inline-block':'none';
    if (db) await loadLeaderboard(db);
  });

  // expose for other pages to write scores: window.evolWriteScore = async (gameId, delta) => ...
  window._evolDb = db;
}

async function loadLeaderboard(db){
  const { collection, query, orderBy, limit, getDocs } =
    await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js');
  const q = query(collection(db,'leaderboard'), orderBy('score','desc'), limit(20));
  const snap = await getDocs(q);
  const tbody = document.querySelector('#boardTbl tbody');
  tbody.innerHTML = '';
  snap.forEach(doc=>{
    const r = doc.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.name||'User'}</td><td>${r.game||'-'}</td><td>${r.score||0}</td>`;
    tbody.appendChild(tr);
  });
}

if (FIREBASE.enabled) initFirebase();