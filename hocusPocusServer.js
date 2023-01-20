import { Server } from "@hocuspocus/server";

const port = process.env.PORT || 3000;

const server = Server.configure({
  port,
});

server.listen();
