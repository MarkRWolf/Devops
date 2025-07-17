// client/src/lib/github/models.ts

export interface GitHubWorkflowRun {
  id: number;
  name?: string;
  node_id?: string;
  head_branch?: string;
  head_sha?: string;
  run_number: number;
  event?: string;
  status?: string;
  conclusion?: string;
  workflow_id: number;
  url?: string;
  html_url?: string;
  created_at: string; // Using string for DateTimes from JSON
  updated_at: string;
  repository?: GitHubRepository;
  head_repository?: GitHubRepository;
}

export interface GitHubRepository {
  id: number;
  node_id?: string;
  name?: string;
  full_name?: string;
  html_url?: string;
}

export interface GitHubJob {
  id: number;
  run_id: number;
  status?: string;
  conclusion?: string;
  started_at: string;
  completed_at?: string;
  name?: string;
  url?: string;
  html_url?: string;
  runner_name?: string;
  labels?: string[];
}

export interface GitHubArtifact {
  id: number;
  node_id?: string;
  name?: string;
  size_in_bytes: number;
  url?: string;
  archive_download_url?: string;
  expired: boolean;
  created_at: string;
  expires_at: string;
}

export interface GitHubFileContent {
  Content: number[]; // byte[] in C# translates to number[] or Uint8Array in TS
  FileName: string;
  ContentType: string;
}
