export type ContentStatus =
  | "Pending"
  | "Writing"
  | "ReadyForImages"
  | "Imaging"
  | "Done"
  | "DoneWithImageError"
  | "Error";

export type AgentName =
  | "TopicGenerator"
  | "ContentWriter"
  | "ImageGenerator"
  | "Publisher"
  | "System";

export type PublishStatus =
  | "Not Started"
  | "Draft"
  | "Queued"
  | "Publishing"
  | "Published"
  | "Failed"
  | "Skipped";

export type PipelineStep =
  | "idle"
  | "topic"
  | "writing"
  | "imaging"
  | "publishing"
  | "done"
  | "error";

export type ImageProviderName = "gemini" | "huggingface";

export type ImageVariant = "linkedin" | "medium" | "instagram";

export interface ContentRow {
  id: string;
  date: string;
  runDateKey: string;
  topic: string;
  linkedInPost: string;
  mediumArticle: string;
  igScript: string;
  ytScript: string;
  devtoArticle: string;
  status: ContentStatus;
  linkedInImageUrl: string;
  mediumImageUrl: string;
  igImageUrl: string;
  createdAt: string;
  updatedAt: string;
  lastAgent: AgentName;
  errorMessage: string;

  linkedInPublishStatus: PublishStatus;
  linkedInPostId: string;
  linkedInUrl: string;
  linkedInPublishedAt: string | null;

  devtoPublishStatus: PublishStatus;
  devtoArticleId: string;
  devtoUrl: string;
  devtoPublishedAt: string | null;

  publishErrors: string;

  imageProvider: string;
  imageGeneratedAt: string | null;
  imageError: string;
}

export interface PipelineState {
  isRunning: boolean;
  currentStep: PipelineStep;
  lastRunAt: string | null;
  lastError: string | null;
  currentTopic: string | null;
  nextScheduledRun: string | null;
}

export interface ActivityLogEntry {
  id: string;
  runDateKey: string;
  contentRowId?: string | null;
  agent: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface GenerateImagesRequest {
  runDateKey: string;
  variants: ImageVariant[];
  provider?: ImageProviderName;
}

export interface GeneratedImageResult {
  variant: ImageVariant;
  provider: ImageProviderName;
  imageUrl: string;
}

export type PublishPlatform = "linkedin" | "devto";

export interface PublishResult {
  platform: PublishPlatform;
  success: boolean;
  message: string;
  externalId?: string;
  url?: string;
  publishedAt?: string;
}

export const CONTENT_KEYWORD_POOL: readonly string[] = [
  "QA",
  "MCP",
  "RAG",
  "LLM",
  "AI Agents",
  "n8n",
  "LangFlow",
  "Crew AI",
  "DeepEval",
  "LangChain",
  "AI Harness",
  "LLM Eval"
];
