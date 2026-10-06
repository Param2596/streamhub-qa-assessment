import { env } from "../../config/env";
import { app } from "./app";
import { loadLoans, loadRepayments } from "./store";

loadLoans();
loadRepayments();

const server = app.listen(env.port, () => {
  console.log(`Loan API listening on ${env.apiBaseUrl}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  console.error(err.message);
  process.exit(1);
});
