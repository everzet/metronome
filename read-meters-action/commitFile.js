module.exports = async ({ octokit, repo, branch, path, content, message }) => {
  const current = await getCurrentContent({ octokit, repo, branch, path });
  if (!current.ok && current.reason === "error") return current;

  if (current.ok && current.content.trim() === content.trim()) {
    return { ok: false, reason: "same_content" };
  }

  try {
    const { data } = await octokit.repos.createOrUpdateFileContents({
      ...repo,
      branch,
      sha: current.sha,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
    });

    return { ok: true, ...data.commit };
  } catch (error) {
    return { ok: false, reason: "error", error };
  }
};

const getCurrentContent = async ({ octokit, repo, branch, path }) => {
  try {
    const ref = branch;
    const { data } = await octokit.repos.getContent({ ...repo, ref, path });
    content = Buffer.from(data.content, "base64").toString("ascii");
    return { ok: true, ...data, content };
  } catch (error) {
    if (error.name === "HttpError" && error.status === 404) {
      return { ok: false, reason: "not_found" };
    }
    return { ok: false, reason: "error", error };
  }
};
