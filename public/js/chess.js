(function () {
  const game = new Chess();
  const statusEl = document.getElementById('status');

  const board = Chessboard('board', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDragStart: (_, piece) => {
      if (game.game_over()) return false;
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) return false;
    },
    onDrop: (source, target) => {
      const move = game.move({from: source, to: target, promotion: 'q'});
      if (move === null) return 'snapback';
      update();
    },
    onSnapEnd: () => board.position(game.fen()),
  });

  function update() {
    let status = '';
    const moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (game.in_checkmate()) {
      status = `Game over, ${moveColor} is checkmated.`;
    } else if (game.in_draw()) {
      status = 'Game drawn.';
    } else {
      status = `${moveColor} to move.`;
      if (game.in_check()) status += ` ${moveColor} is in check.`;
    }
    statusEl.textContent = status;
  }

  document.getElementById('newGameBtn').onclick = () => {
    game.reset();
    board.start();
    update();
  };

  document.getElementById('flipBtn').onclick = () => board.flip();

  update();
})();