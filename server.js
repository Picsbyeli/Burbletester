// server.js
const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

/** In-memory lobby state (simple; for production you'd persist) */
const lobbies = new Map();
/**
 * lobby shape:
 * {
 *   id,
 *   hostId,
 *   players: Map<socketId, {name, score}>
 *   category: 'Animals' | 'Foods' | ...
 *   word: 'GIRAFFE'
 *   round: number
 *   phase: 'idle'|'clue'|'vote'|'reveal'
 *   votes: Map<voterId, accusedId>
 *   impostorId: socketId
 *   wordsPool: { category:string, words:string[] }[]
 * }
 */

const DEFAULT_POOLS = [
  { category: 'Animals', words: ['GIRAFFE','PANDA','SHARK','EAGLE','KANGAROO','TURTLE','DOLPHIN']},
  { category: 'Foods', words: ['PIZZA','SUSHI','BURGER','TACO','PASTA','SALAD','PANCAKES']},
  { category: 'Sports', words: ['SOCCER','BASKETBALL','TENNIS','HOCKEY','GOLF','BOXING','SWIMMING']},
  { category: 'School', words: ['TEACHER','HOMEWORK','LIBRARY','CAFETERIA','LOCKER','EXAM','BACKPACK']},
];

/** Helpers */
function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function newLobby(id, hostId) {
  return {
    id, hostId,
    players: new Map(),
    category: 'Animals',
    word: null,
    round: 0,
    phase: 'idle',
    votes: new Map(),
    impostorId: null,
    wordsPool: JSON.parse(JSON.stringify(DEFAULT_POOLS))
  };
}

function startRound(lobby) {
  lobby.round += 1;
  lobby.phase = 'clue';
  lobby.votes.clear();

  // pick category/word
  const pool = lobby.wordsPool.find(p => p.category === lobby.category) || pickRandom(lobby.wordsPool);
  lobby.category = pool.category;
  lobby.word = pickRandom(pool.words);

  // pick impostor
  const ids = [...lobby.players.keys()];
  lobby.impostorId = pickRandom(ids);

  // announce to each player privately
  ids.forEach(id => {
    const isImpostor = id === lobby.impostorId;
    io.to(id).emit('round:start', {
      round: lobby.round,
      category: lobby.category,
      word: isImpostor ? null : lobby.word,
      youAreImpostor: isImpostor
    });
  });

  // to room
  io.to(lobby.id).emit('lobby:update', publicLobbyState(lobby));
}

function publicLobbyState(l) {
  return {
    id: l.id,
    hostId: l.hostId,
    players: [...l.players.entries()].map(([id, p]) => ({ id, name: p.name, score: p.score })),
    category: l.category,
    round: l.round,
    phase: l.phase
  };
}

/** Socket handlers */
io.on('connection', (socket) => {
  socket.on('lobby:create', ({ lobbyId, name }) => {
    if (!lobbies.has(lobbyId)) {
      lobbies.set(lobbyId, newLobby(lobbyId, socket.id));
    }
    const lobby = lobbies.get(lobbyId);
    lobby.players.set(socket.id, { name: name?.trim() || 'Player', score: 0 });
    socket.join(lobbyId);
    io.to(lobbyId).emit('lobby:update', publicLobbyState(lobby));
  });

  socket.on('lobby:join', ({ lobbyId, name }) => {
    if (!lobbies.has(lobbyId)) return socket.emit('error', 'Lobby does not exist.');
    const lobby = lobbies.get(lobbyId);
    lobby.players.set(socket.id, { name: name?.trim() || 'Player', score: 0 });
    socket.join(lobbyId);
    io.to(lobbyId).emit('lobby:update', publicLobbyState(lobby));
  });

  socket.on('lobby:setCategory', ({ lobbyId, category }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    if (socket.id !== lobby.hostId) return;
    lobby.category = category;
    io.to(lobbyId).emit('lobby:update', publicLobbyState(lobby));
  });

  socket.on('round:start', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    if (socket.id !== lobby.hostId) return;
    startRound(lobby);
  });

  // chat/clue phase messages
  socket.on('clue:send', ({ lobbyId, text }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || lobby.phase !== 'clue') return;
    const player = lobby.players.get(socket.id);
    if (!player) return;
    io.to(lobbyId).emit('clue:message', { from: socket.id, name: player.name, text: (text||'').slice(0,120) });
  });

  // move to vote phase (host only)
  socket.on('phase:vote', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || socket.id !== lobby.hostId) return;
    lobby.phase = 'vote';
    lobby.votes.clear();
    io.to(lobbyId).emit('phase:changed', { phase: 'vote' });
  });

  // collect votes
  socket.on('vote:accuse', ({ lobbyId, accusedId }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || lobby.phase !== 'vote') return;
    lobby.votes.set(socket.id, accusedId);
    io.to(lobbyId).emit('vote:update', { voterId: socket.id, accusedId });
  });

  // finish voting, reveal + score
  socket.on('vote:reveal', ({ lobbyId, impostorGuess }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || socket.id !== lobby.hostId) return;

    lobby.phase = 'reveal';

    // tally
    const counts = {};
    for (const accused of lobby.votes.values()) {
      counts[accused] = (counts[accused] || 0) + 1;
    }
    const accusedId = Object.entries(counts).sort((a,b)=> b[1]-a[1])[0]?.[0] || null;

    let impostorCaught = (accusedId === lobby.impostorId);
    let impostorGuessedCorrect = false;

    if (impostorCaught) {
      // impostor gets one chance: if they guess word exactly, they steal the round (optional tweak).
      impostorGuessedCorrect = typeof impostorGuess === 'string' &&
        impostorGuess.trim().toUpperCase() === lobby.word;

      if (impostorGuessedCorrect) {
        // impostor rewards
        const imp = lobby.players.get(lobby.impostorId);
        if (imp) imp.score += 3; // bonus for clutch guess
      } else {
        // crew rewards
        for (const [id, p] of lobby.players) {
          if (id !== lobby.impostorId) p.score += 2;
        }
      }
    } else {
      // impostor escaped → larger reward
      const imp = lobby.players.get(lobby.impostorId);
      if (imp) imp.score += 3;
    }

    io.to(lobby.id).emit('round:reveal', {
      impostorId: lobby.impostorId,
      word: lobby.word,
      impostorCaught,
      impostorGuessedCorrect,
      scores: [...lobby.players.entries()].map(([id,p])=>({id,name:p.name,score:p.score}))
    });

    // back to idle
    lobby.phase = 'idle';
    io.to(lobby.id).emit('lobby:update', publicLobbyState(lobby));
  });

  socket.on('disconnect', () => {
    // clean up
    for (const [lobbyId, lobby] of lobbies.entries()) {
      if (!lobby.players.has(socket.id)) continue;
      lobby.players.delete(socket.id);
      if (socket.id === lobby.hostId) {
        // reassign host if anyone remains
        const next = [...lobby.players.keys()][0];
        lobby.hostId = next || null;
      }
      if (lobby.players.size === 0) {
        lobbies.delete(lobbyId);
      } else {
        io.to(lobbyId).emit('lobby:update', publicLobbyState(lobby));
      }
    }
  });
});

httpServer.listen(3000, () => console.log('✅ Imposter server on :3000'));