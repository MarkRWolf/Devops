export interface AzureBuild {
  id: number;
  buildNumber?: string;
  status?: string;
  result?: string;
  queueTime: string;
  startTime?: string;
  finishTime?: string;
}

export interface AzureJob {
  id: string;
  name?: string;
  state?: string;
  result?: string;
  startTime?: string;
  finishTime?: string;
}

export interface AzureArtifact {
  name: string;
  resource: {
    downloadUrl?: string;
  };
}
