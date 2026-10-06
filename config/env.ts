import dotenv from "dotenv";
import path from "path";
import { projectRoot } from "./paths";

dotenv.config({ path: path.join(projectRoot(), ".env"), quiet: true });

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return Number(raw);
}

const port = intFromEnv("API_PORT", 3000);
const testApiPort = intFromEnv("TEST_API_PORT", 3011);

export const env = {
  port,
  apiBaseUrl: process.env.API_BASE_URL?.trim() || `http://127.0.0.1:${port}`,
  testApiPort,
  testApiBaseUrl: process.env.TEST_API_BASE_URL?.trim() || `http://127.0.0.1:${testApiPort}`,
  emiBaseUrl: process.env.EMI_BASE_URL?.trim() || "https://emicalculator.net/",
  defaultPage: intFromEnv("DEFAULT_PAGE", 1),
  defaultLimit: intFromEnv("DEFAULT_LIMIT", 10),
  maxLimit: intFromEnv("MAX_LIMIT", 50),
};
