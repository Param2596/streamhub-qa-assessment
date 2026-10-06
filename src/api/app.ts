import express from "express";
import { errorHandler, methodNotAllowed, notFound } from "./errors";
import { createLoanHandler, getLoan, listLoans } from "./routes/loans";
import { listRepayments } from "./routes/repayments";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.route("/api/v1/loans").get(listLoans).post(createLoanHandler).all(methodNotAllowed("GET", "POST"));
app.route("/api/v1/loans/:id").get(getLoan).all(methodNotAllowed("GET"));
app.route("/api/v1/repayments").get(listRepayments).all(methodNotAllowed("GET"));

app.use(notFound);
app.use(errorHandler);
