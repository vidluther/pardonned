import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateText, type LanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { categorizeOffense } from "../src/lib/parsers/categorize.js";
import type { OffenseCategory } from "../src/lib/parsers/types.js";

type AIProvider = "openai-compatible" | "anthropic";

const AI_PROVIDER: AIProvider = (process.env.AI_PROVIDER as AIProvider) ?? "openai-compatible";
const AI_BASE_URL = process.env.AI_BASE_URL ?? "http://localhost:1234/v1";
const AI_MODEL = process.env.AI_MODEL ?? "";
const AI_API_KEY = process.env.AI_API_KEY ?? "not-needed";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? "30000");

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = resolve(__dirname, "../data/offense-categories-map.json");
const DB_PATH_ENV = process.env.PARDONNED_DB;

const SYSTEM_PROMPT = `You are a US federal offense classifier. Given an offense description, classify it into a single category so that we can create a search facet on the web. 

Respond with ONLY the category name. If your answer is "other", then provide a concise category that you would recommend in parentheses.

For example other (mail fraud). No explanation, no punctuation, no extra text.`;

interface OffenseCache {
  [key: string]: OffenseCategory;
}

function loadCache(): OffenseCache {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as OffenseCache;
  } catch {
    return {};
  }
}

function saveCache(cache: OffenseCache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

function createModel(modelId: string): LanguageModel {
  switch (AI_PROVIDER) {
    case "anthropic": {
      const provider = createAnthropic({
        apiKey: AI_API_KEY,
        baseURL: AI_BASE_URL,
      });
      return provider(modelId);
    }
    case "openai-compatible":
    default: {
      const provider = createOpenAICompatible({
        name: "local-llm",
        baseURL: AI_BASE_URL,
        apiKey: AI_API_KEY,
      });
      return provider.chatModel(modelId);
    }
  }
}

async function detectModel(): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/models`, {
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch models from ${AI_BASE_URL}: ${res.status} ${res.statusText}. ` +
        `Set AI_MODEL explicitly if the server doesn't support /models.`,
    );
  }
  const data = (await res.json()) as { data: { id: string }[] };
  if (!data.data || data.data.length === 0) {
    throw new Error(
      `No models found at ${AI_BASE_URL}. Load a model and try again, or set AI_MODEL explicitly.`,
    );
  }
  return data.data[0].id;
}

async function classifyWithAI(offense: string, modelId: string): Promise<string> {
  const { text } = await generateText({
    model: createModel(modelId),
    system: SYSTEM_PROMPT,
    prompt: offense,
    maxOutputTokens: 20,
    temperature: 0,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  const raw = text.trim();
  if (!raw) {
    throw new Error(
      `Model returned empty response for offense: "${offense}". ` +
        `Check that the model is loaded and responding correctly.`,
    );
  }

  const category = raw.toLowerCase().trim();

  return category;
}

function normalizeOffense(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

async function getUniqueOffenses(): Promise<string[]> {
  if (!DB_PATH_ENV) {
    throw new Error("Missing required environment variable: PARDONNED_DB");
  }

  const dbPath = resolve(DB_PATH_ENV);
  const client = createClient({ url: `file:${dbPath}` });

  const result = await client.execute(
    "SELECT DISTINCT offense FROM pardons WHERE offense IS NOT NULL AND offense != '' ORDER BY offense",
  );
  await client.close();

  return result.rows.map((r) => r.offense as string);
}

async function main(): Promise<void> {
  console.log("=== Offense Classification Script ===\n");

  const model = AI_MODEL || (await detectModel());
  console.log(`Provider: ${AI_PROVIDER}`);
  console.log(`Model: ${model}`);
  console.log(`Base URL: ${AI_BASE_URL}`);
  console.log(`Timeout: ${AI_TIMEOUT_MS}ms\n`);

  const rawOffenses = await getUniqueOffenses();
  const offenses = rawOffenses.map(normalizeOffense);
  console.log(`Found ${offenses.length} unique offenses in database\n`);

  const cache = loadCache();
  console.log(`Existing cache: ${Object.keys(cache).length} entries\n`);

  const unclassified = offenses.filter((o) => {
    const key = o.toLowerCase().trim();
    return !(key in cache);
  });

  console.log(`Unclassified: ${unclassified.length} offenses to process\n`);

  if (unclassified.length === 0) {
    console.log("All offenses already classified. Nothing to do.");
    return;
  }

  let newlyClassified = 0;

  for (let i = 0; i < unclassified.length; i++) {
    const offense = unclassified[i];
    const key = offense.toLowerCase().trim();
    const regexResult = categorizeOffense(offense);

    process.stdout.write(`[${i + 1}/${unclassified.length}] "${offense}" → `);

    const aiCategory = await classifyWithAI(offense, model);

    console.log(aiCategory);

    cache[key] = aiCategory as OffenseCategory;
    newlyClassified++;

    saveCache(cache);
  }

  saveCache(cache);

  console.log("\n=== Summary ===");
  console.log(`Total unique offenses: ${offenses.length}`);
  console.log(`Already cached:        ${offenses.length - unclassified.length}`);
  console.log(`Newly classified:       ${newlyClassified}`);
  console.log(`Cache size:            ${Object.keys(cache).length}`);
  console.log(`\nCache written to: ${CACHE_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
