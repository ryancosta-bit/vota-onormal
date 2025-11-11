const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let jogadores = {}; // {socketId: {nick, escolha, cor}}

io.on("connection", (socket) => {
  console.log("Novo jogador conectado:", socket.id);

  socket.on("registrar", nick => {
    const cor = "#" + Math.floor(Math.random()*16777215).toString(16);
    jogadores[socket.id] = {nick, escolha: "cima", cor};
    io.emit("jogadores", jogadores);
  });

  socket.on("atualizarEscolha", escolha => {
    if(jogadores[socket.id]){
      jogadores[socket.id].escolha = escolha;
      io.emit("jogadores", jogadores);
    }
  });

  socket.on("limparSelecoes", () => {
    for(const j of Object.values(jogadores)){
      if(j.nick.toLowerCase()!=="mestre") j.escolha = null;
    }
    io.emit("jogadores", jogadores);
  });

  socket.on("novaVotacao", data => {
    io.emit("iniciarVotacao", data);
  });

  socket.on("atualizarTexto", data => {
    socket.broadcast.emit("atualizarTexto", data);
  });

  socket.on("disconnect", () => {
    delete jogadores[socket.id];
    io.emit("jogadores", jogadores);
  });
});

http.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
