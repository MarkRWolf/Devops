export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  hasGitHubConfig: boolean;
  hasAzureConfig: boolean;
}
