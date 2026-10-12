import { defineRailway, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "VidIn-Project";
export default defineRailway(() => {
  const VidInProject = service("VidIn-Project", {
    // dockerfilePath from CaC: "Dockerfile"
    // builder from CaC: "DOCKERFILE"
    healthcheck: "/api/health",
    healthcheckTimeout: 300,
  });

  return project("VidIn", {
    variables: { managed: false },
    resources: [VidInProject],
  });
});
