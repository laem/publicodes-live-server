import { Server } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { SQLite } from "@hocuspocus/extension-sqlite";
import { Monitor } from "@hocuspocus/extension-monitor";

const port = process.env.PORT || 3000;

const server = Server.configure({
  port,
  address: "localhost",
  extensions: [
    new Logger(),
    new SQLite(),
    new Monitor({
      // [optional] the path the dashboard will be visible on. if you want to
      // show the dashboard at the root of use an empty string. defaults to "dashboard"
      dashboardPath: "dashboard",

      // [optional] you can completely disable the dashboard and just collect metrics.
      // defaults to "true"
      enableDashboard: true,

      // [optional] interval in ms to collect metrics, for example connection count,
      // message count, etc. defaults to "10000"
      metricsInterval: 10000,

      // [optional] interval in ms to collect metrics from your operating system
      // like cpu usage or memory usage. defauls to "10000"
      osMetricsInterval: 10000,

      // [optional] you can launch the dashboard on a different port. if set to null,
      // the dashboard will run on the same port Hocuspocus it self is running.
      // defaults to "null"
      port: null,

      // [optional] add basic auth to your dashboard,
      // defaults to "null"
      password: null,
      user: null,
    }),
  ],
});

server.listen();
