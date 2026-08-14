import { randomBytes } from "crypto";
import { spawn, type ChildProcess } from "child_process";
import path from "path";

const servicePort = Number(process.env.FASTAPI_PORT || 8011);
const internalToken = process.env.FASTAPI_INTERNAL_TOKEN || randomBytes(32).toString("hex");
let processHandle: ChildProcess | undefined;

export function startFastapiService() {
  if (process.env.FASTAPI_ENABLED === "false" || processHandle) return;
  processHandle = spawn("python3", ["-m", "uvicorn", "fastapi_service.app:app", "--host", "127.0.0.1", "--port", String(servicePort), "--log-level", "warning"], {
    cwd: process.cwd(),
    env: { ...process.env, FASTAPI_INTERNAL_TOKEN: internalToken },
    stdio: ["ignore", "ignore", "pipe"],
  });
  processHandle.on("error", () => console.error("[FastAPI] Internal automation service could not start"));
  processHandle.stderr?.on("data", () => console.error("[FastAPI] Internal automation service reported an error"));
  process.once("exit", () => processHandle?.kill("SIGTERM"));
}

export async function callFastapi<T>(route: string, body: unknown): Promise<T> {
  const response = await fetch(`http://127.0.0.1:${servicePort}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-cyberdog-internal-token": internalToken },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(50_000),
  });
  if (!response.ok) throw new Error("Automation service request failed");
  return response.json() as Promise<T>;
}
