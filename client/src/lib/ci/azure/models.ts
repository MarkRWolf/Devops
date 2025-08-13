// client/src/lib/ci/azure/models.ts
export interface AzureBuildsResponse {
  value?: AzureBuild[];
}

export interface AzureBuild {
  id: number;
  buildNumber?: string;
  status?: string;
  result?: string;
  queueTime: string;
  startTime?: string;
  finishTime?: string;
}

export interface AzureTimelineResponse {
  records?: AzureJob[];
}

export interface AzureJob {
  id: string;
  name?: string;
  state?: string;
  result?: string;
  startTime?: string;
  finishTime?: string;
}

export interface AzureArtifactsResponse {
  value?: AzureArtifact[];
}

export interface AzureArtifact {
  name: string;
  resource: AzureResource;
}

export interface AzureResource {
  downloadUrl?: string;
}
