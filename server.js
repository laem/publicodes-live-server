import http from "http";
import WebSocket from "ws";
import * as Y from "yjs";
import { MongodbPersistence } from "y-mongodb-provider";
import yUtils from "y-websocket/bin/utils";

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

// y-websocket
const wss = new WebSocket.Server({ server });
wss.on("connection", yUtils.setupWSConnection);

const connectionString =
  process.env.SCALINGO_MONGO_URL || "mongodb://localhost:27017/publicodes-live";
/*
 * y-mongodb-provider
 *  with all possible options (see API section below)
 */
const mdb = new MongodbPersistence(connectionString, {
  collectionName: "transactions",
  flushSize: 100,
  multipleCollections: true,
});

/*
 Persistence must have the following signature:
{ bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise }
*/
yUtils.setPersistence({
  bindState: async (docName, ydoc) => {
    const persistedYdoc = await mdb.getYDoc(docName);
    // get the state vector so we can just store the diffs between client and server
    const persistedStateVector = Y.encodeStateVector(persistedYdoc);

    /* we could also retrieve that sv with a mdb function
     *  however this takes longer;
     *  it would also flush the document (which merges all updates into one)
     *   thats prob a good thing, which is why we always do this on document close (see writeState)
     */
    //const persistedStateVector = await mdb.getStateVector(docName);

    // in the default code the following value gets saved in the db
    //  this however leads to the case that multiple complete Y.Docs are saved in the db (https://github.com/fadiquader/y-mongodb/issues/7)
    //const newUpdates = Y.encodeStateAsUpdate(ydoc);

    // better just get the differences and save those:
    const diff = Y.encodeStateAsUpdate(ydoc, persistedStateVector);

    // store the new data in db (if there is any: empty update is an array of 0s)
    if (
      diff.reduce(
        (previousValue, currentValue) => previousValue + currentValue,
        0
      ) > 0
    )
      mdb.storeUpdate(docName, diff);

    // send the persisted data to clients
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

    // store updates of the document in db
    ydoc.on("update", async (update) => {
      mdb.storeUpdate(docName, update);
    });

    // cleanup some memory
    persistedYdoc.destroy();
  },
  writeState: async (docName, ydoc) => {
    // This is called when all connections to the document are closed.

    // flush document on close to have the smallest possible database
    await mdb.flushDocument(docName);
  },
});

const port = process.env.port || 3000;
server.listen(port, () => {
  console.log("listening on port:" + port);
});
