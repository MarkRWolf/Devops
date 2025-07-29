**GitHub Actions (base URL: `https://api.github.com`)**

- **List all workflow runs**

  ```http
  GET /actions/runs
  ```

- **Get a single workflow run**

  ```http
  GET /actions/runs/{run_id}
  ```

- **List jobs for a run**

  ```http
  GET /actions/runs/{run_id}/jobs
  ```

- **Download logs for a run**

  ```http
  GET /actions/runs/{run_id}/logs
  ```

- **List artifacts in a run**

  ```http
  GET /actions/runs/{run_id}/artifacts
  ```

- **Download a specific artifact**

  ```http
  GET /actions/artifacts/{artifact_id}/zip
  ```

---

**Azure DevOps Pipelines (YAML)
(base URL: `https://dev.azure.com/{yourOrg}` or `https://{yourOrg}.visualstudio.com`)**

- **List all pipelines**

  ```http
  GET /_apis/pipelines?api-version=7.1-preview.1
  ```

- **Get a single pipeline**

  ```http
  GET /_apis/pipelines/{pipelineId}?api-version=7.1-preview.1
  ```

- **List runs for a pipeline**

  ```http
  GET /_apis/pipelines/{pipelineId}/runs?api-version=7.1-preview.1
  ```

- **Get a single pipeline run**

  ```http
  GET /_apis/pipelines/{pipelineId}/runs/{runId}?api-version=7.1-preview.1
  ```

---

**Azure DevOps Builds (Classic CI)**

- **List build definitions**

  ```http
  GET /_apis/build/definitions?api-version=6.0
  ```

- **List build runs**

  ```http
  GET /_apis/build/builds?api-version=6.0
  ```

- **Get build logs list**

  ```http
  GET /_apis/build/builds/{buildId}/logs?api-version=6.0
  ```

- **Download a specific log file**

  ```http
  GET /_apis/build/builds/{buildId}/logs/{logId}?api-version=6.0
  ```

- **Get build timeline (step details)**

  ```http
  GET /_apis/build/builds/{buildId}/timeline?api-version=6.0
  ```

- **List build artifacts**

  ```http
  GET /_apis/build/builds/{buildId}/artifacts?api-version=6.0
  ```

- **Download a build artifact**

  ```http
  GET /_apis/build/builds/{buildId}/artifacts?artifactName={name}&api-version=6.0
  ```
