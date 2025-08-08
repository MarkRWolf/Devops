namespace Devops.Models;

using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

public sealed class AzureBuildsResponse
{
    [JsonPropertyName("value")]
    public List<AzureBuild>? Builds { get; set; }
}

public sealed class AzureBuild
{
    [JsonPropertyName("id")]          public int Id           { get; set; }
    [JsonPropertyName("buildNumber")] public string? Number   { get; set; }
    [JsonPropertyName("status")]      public string? Status   { get; set; }
    [JsonPropertyName("result")]      public string? Result   { get; set; }
    [JsonPropertyName("queueTime")]   public DateTime Queue   { get; set; }
    [JsonPropertyName("startTime")]   public DateTime? Start  { get; set; }
    [JsonPropertyName("finishTime")]  public DateTime? Finish { get; set; }
}

public sealed class AzureTimelineResponse
{
    [JsonPropertyName("records")]
    public List<AzureJob>? Records { get; set; }
}

public sealed class AzureJob
{
    [JsonPropertyName("id")]          public string Id        { get; set; } = string.Empty;
    [JsonPropertyName("name")]        public string? Name     { get; set; }
    [JsonPropertyName("state")]       public string? State    { get; set; }
    [JsonPropertyName("result")]      public string? Result   { get; set; }
    [JsonPropertyName("startTime")]   public DateTime? Start  { get; set; }
    [JsonPropertyName("finishTime")]  public DateTime? Finish { get; set; }
}

public sealed class AzureArtifactsResponse
{
    [JsonPropertyName("value")]
    public List<AzureArtifact>? Artifacts { get; set; }
}

public sealed class AzureArtifact
{
    [JsonPropertyName("name")]        public string Name   { get; set; } = string.Empty;
    [JsonPropertyName("resource")]    public AzureResource Resource { get; set; } = new();
}       

public sealed class AzureResource
{
    [JsonPropertyName("downloadUrl")] public string? DownloadUrl { get; set; }
}
