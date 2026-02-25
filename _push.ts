import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;
  if (!xReplitToken) throw new Error("X-Replit-Token not found");
  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=github",
    { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
  ).then((r) => r.json()).then((d) => d.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error("GitHub not connected");
  return accessToken;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  const owner = "ajlw365";
  const repo = "m-dee-multiplayer";
  const rootDir = "/home/runner/workspace";

  function getAllFiles(dir: string, base = ""): string[] {
    let results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (["node_modules", ".git", ".cache", ".next", ".replit", "replit.nix", ".local", ".config", ".upm", "__pycache__"].includes(entry.name)) continue;
      if (entry.isDirectory()) results = results.concat(getAllFiles(path.join(dir, entry.name), rel));
      else results.push(rel);
    }
    return results;
  }

  const files = getAllFiles(rootDir);
  console.log(`Pushing ${files.length} files...`);

  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: "heads/main" });
  const latestSha = ref.object.sha;

  const treeItems: any[] = [];
  let count = 0;
  for (const file of files) {
    const content = fs.readFileSync(path.join(rootDir, file)).toString("base64");
    try {
      const { data: blob } = await octokit.git.createBlob({ owner, repo, content, encoding: "base64" });
      treeItems.push({ path: file, mode: "100644", type: "blob", sha: blob.sha });
      count++;
      if (count % 20 === 0) console.log(`  ${count}/${files.length}...`);
    } catch (e: any) {
      console.log(`  Skip ${file}: ${e.message}`);
    }
  }
  console.log(`${treeItems.length} blobs. Creating tree...`);

  const { data: tree } = await octokit.git.createTree({ owner, repo, tree: treeItems, base_tree: latestSha });
  const { data: commit } = await octokit.git.createCommit({
    owner, repo, message: "Fix deployment health checks - immediate server listening", tree: tree.sha, parents: [latestSha]
  });
  await octokit.git.updateRef({ owner, repo, ref: "heads/main", sha: commit.sha });
  console.log(`\nDone! https://github.com/${owner}/${repo}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
