const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let mestreSocket = null;
let votacaoAtiva = false;
let opcoes = ["Opção A", "Opção B"];
let jogadores = {};

io.on("connection", (socket) => {
  console.log("Novo usuário conectado:", socket.id);

  socket.on("registrar", (nick) => {
    if (nick.toLowerCase() === "mestre") {
      mestreSocket = socket;
      socket.emit("painelMestre");
    } else {
      jogadores[socket.id] = { nick, posicao: null, cor: randomColor() };
      io.emit("jogadores", jogadores);
    }
  });

  socket.on("atualizarPosicao", (posicao) => {
    if (jogadores[socket.id]) {
      jogadores[socket.id].posicao = posicao;
      io.emit("jogadores", jogadores);
    }
  });

  socket.on("novaVotacao", (dados) => {
    if (socket === mestreSocket) {
      opcoes = dados.opcoes;
      votacaoAtiva = true;
      io.emit("iniciarVotacao", opcoes);
      setTimeout(() => encerrarVotacao(), dados.tempo * 1000);
    }
  });

  socket.on("disconnect", () => {
    delete jogadores[socket.id];
    io.emit("jogadores", jogadores);
  });
});

function encerrarVotacao() {
  votacaoAtiva = false;
  let cima = 0, baixo = 0;
  for (const j of Object.values(jogadores)) {
    if (j.posicao === "cima") cima++;
    else if (j.posicao === "baixo") baixo++;
  }

  const resultado = 
    cima > baixo ? opcoes[0] : 
    baixo > cima ? opcoes[1] : "Empate!";
    
  io.emit("resultado", resultado);
}

function randomColor() {
  const cores = ["#a020f0", "#8a2be2", "#9370db", "#c71585", "#9400d3"];
  return cores[Math.floor(Math.random() * cores.length)];
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Servidor rodando na porta", PORT));
