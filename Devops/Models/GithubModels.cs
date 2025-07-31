namespace Devops.Models;

using System.Text.Json.Serialization;
using System; 
using System.Collections.Generic;

public class GitHubWorkflowRunsResponse
{
    [JsonPropertyName("total_count")]
    public int TotalCount { get; set; }

    [JsonPropertyName("workflow_runs")]
    public List<GitHubWorkflowRun>? WorkflowRuns { get; set; }
}

public class GitHubWorkflowRun
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("node_id")]
    public string? NodeId { get; set; }

    [JsonPropertyName("head_branch")]
    public string? HeadBranch { get; set; }

    [JsonPropertyName("head_sha")]
    public string? HeadSha { get; set; }

    [JsonPropertyName("run_number")]
    public int RunNumber { get; set; }

    [JsonPropertyName("event")]
    public string? Event { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("conclusion")]
    public string? Conclusion { get; set; }

    [JsonPropertyName("workflow_id")]
    public long WorkflowId { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("html_url")]
    public string? HtmlUrl { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [JsonPropertyName("repository")]
    public GitHubRepository? Repository { get; set; } 

    [JsonPropertyName("head_repository")]
    public GitHubRepository? HeadRepository { get; set; } 
}

public class GitHubRepository
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("node_id")]
    public string? NodeId { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("full_name")]
    public string? FullName { get; set; }

    [JsonPropertyName("html_url")]
    public string? HtmlUrl { get; set; }
}

public class GitHubJobsResponse
{
    [JsonPropertyName("total_count")]
    public int TotalCount { get; set; }

    [JsonPropertyName("jobs")]
    public List<GitHubJob>? Jobs { get; set; }
}

public class GitHubJob
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("run_id")]
    public long RunId { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("conclusion")]
    public string? Conclusion { get; set; }

    [JsonPropertyName("started_at")]
    public DateTime StartedAt { get; set; }

    [JsonPropertyName("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("html_url")]
    public string? HtmlUrl { get; set; }

    [JsonPropertyName("runner_name")]
    public string? RunnerName { get; set; }

    [JsonPropertyName("labels")]
    public List<string>? Labels { get; set; }
}

public class GitHubArtifactsResponse
{
    [JsonPropertyName("total_count")]
    public int TotalCount { get; set; }

    [JsonPropertyName("artifacts")]
    public List<GitHubArtifact>? Artifacts { get; set; }
}

public class GitHubArtifact
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("node_id")]
    public string? NodeId { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("size_in_bytes")]
    public long SizeInBytes { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; } 

    [JsonPropertyName("archive_download_url")]
    public string? ArchiveDownloadUrl { get; set; } 

    [JsonPropertyName("expired")]
    public bool Expired { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("expires_at")]
    public DateTime ExpiresAt { get; set; }
}

public class GitHubFileContent
{
    public byte[] Content { get; set; } = [];
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
}