import Groq from "groq-sdk";

import { CONTENT_KEYWORD_POOL } from "@/lib/types";

const MODEL = "llama-3.3-70b-versatile";

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  return new Groq({ apiKey });
}

async function generateText(prompt: string, maxTokens: number): Promise<string> {
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: maxTokens,
    messages: [
      {
        role: "system",
        content:
          "You write technical content in a direct, opinionated, practical voice. Use short paragraphs, concrete examples, and avoid hype, filler, and vague claims. Return only the requested content."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return content;
}

export async function generateFreshTopic(existingTopics: string[]): Promise<string> {
  return generateText(
    [
      "Generate one fresh technical content topic title.",
      "Use this keyword pool as inspiration:",
      ...CONTENT_KEYWORD_POOL.map((keyword) => `- ${keyword}`),
      "Avoid these existing topics:",
      ...(existingTopics.length > 0 ? existingTopics.map((topic) => `- ${topic}`) : ["- none"]),
      "Requirements:",
      "- exactly one topic title",
      "- max 12 words",
      "- practical and specific",
      "- no numbering",
      "- no quotes"
    ].join("\n"),
    120
  );
}

function buildContentPrompt(topic: string, target: string, instructions: string): string {
  return [
    `Topic: ${topic}`,
    `Target: ${target}`,
    instructions,
    "Style constraints:",
    "- direct and practical tone",
    "- short paragraphs",
    "- real examples and implementation details",
    "- no hype phrases like game-changer or dive deep"
  ].join("\n");
}

export async function generateLinkedInPost(topic: string): Promise<string> {
  return generateText(
    buildContentPrompt(
      topic,
      "LinkedIn post, 150 to 200 words",
      "Write a sharp LinkedIn post with a strong opening, a practical takeaway, and a closing line that invites discussion without sounding promotional."
    ),
    600
  );
}

export async function generateMediumArticle(topic: string): Promise<string> {
  return generateText(
    buildContentPrompt(
      topic,
      "Medium article, around 3000 words in markdown",
      "Write a complete markdown article with clear headings, examples, tradeoffs, and a concise conclusion."
    ),
    6000
  );
}

export async function generateInstagramScript(topic: string): Promise<string> {
  return generateText(
    buildContentPrompt(
      topic,
      "Instagram reel or carousel script",
      "Write a script with scene-by-scene or slide-by-slide beats that stay technical but visually punchy."
    ),
    900
  );
}

export async function generateYoutubeScript(topic: string): Promise<string> {
  return generateText(
    buildContentPrompt(
      topic,
      "YouTube script with intro, body, outro, and timestamps",
      "Write a technical YouTube script with timestamps, a clear narrative arc, and concrete examples."
    ),
    2200
  );
}

export async function generateDevtoArticle(topic: string): Promise<string> {
  return generateText(
    buildContentPrompt(
      topic,
      "Dev.to article, around 2000 words in markdown",
      "Write a markdown technical article for Dev.to with practical code-oriented framing, section headings, and a concise close."
    ),
    4200
  );
}
