import { Server } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { SQLite } from "@hocuspocus/extension-sqlite";

const port = process.env.PORT || 3000;

const server = Server.configure({
  port,
  address: "localhost",
  extensions: [new Logger(), new SQLite()],
});

server.listen();
