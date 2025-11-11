const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let jogadores = {};
let votacao = null;

io.on("connection", (socket) => {
  console.log("Novo jogador conectado:", socket.id);

  // Registrar jogador
  socket.on("registrar", (nick) => {
    jogadores[socket.id] = {
      nick,
      escolha: null,
      x: 0,
      y: 0,
      cor: "#" + Math.floor(Math.random() * 16777215).toString(16)
    };

    if (nick.toLowerCase() === "mestre") {
      socket.emit("painelMestre");
    }

    io.emit("jogadores", jogadores);
  });

  // Atualizar posição/escolha
  socket.on("atualizarEscolha", (escolha) => {
    if (jogadores[socket.id]) {
      jogadores[socket.id].escolha = escolha;
      io.emit("jogadores", jogadores);
    }
  });

  // Nova votação
  socket.on("novaVotacao", (data) => {
    votacao = {
      opcoes: data.opcoes,
      tempo: data.tempo
    };
    io.emit("iniciarVotacao", votacao);
  });

  // Limpar seleções (mestre)
  socket.on("limparSelecoes", () => {
    for (let j in jogadores) {
      if (jogadores[j].nick.toLowerCase() !== "mestre") {
        jogadores[j].escolha = null;
      }
    }
    io.emit("jogadores", jogadores);
  });

  // Desconexão
  socket.on("disconnect", () => {
    delete jogadores[socket.id];
    io.emit("jogadores", jogadores);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
