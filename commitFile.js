module.exports = async (git, repo, ref, path, content, message) => {
  const lastCommit = await getLastCommitInRef(git, repo, ref);
  const baseTree = await getBaseTree(git, repo, lastCommit);

  const contentBlob = await createContentBlob(git, repo, content);
  const newTree = await createSubTree(git, repo, baseTree, path, contentBlob);
  const newCommit = await createCommit(git, repo, lastCommit, newTree, message);

  const updatedRef = await pointRefToCommit(git, repo, ref, newCommit);

  return updatedRef;
};

async function getLastCommitInRef(git, repo, ref) {
  const {
    data: { object },
  } = await git.getRef({ ...repo, ref });

  return object;
}

async function getBaseTree(git, repo, lastCommit) {
  const {
    data: { tree },
  } = await git.getCommit({ ...repo, commit_sha: lastCommit.sha });

  return tree;
}

async function createContentBlob(git, repo, content) {
  const { data: blob } = await git.createBlob({
    ...repo,
    content,
    encoding: "utf-8",
  });

  return blob;
}

async function createSubTree(git, repo, baseTree, path, contentBlob) {
  const { data: subTree } = await git.createTree({
    ...repo,
    base_tree: baseTree.sha,
    tree: [
      {
        path,
        mode: "100644",
        type: "blob",
        sha: contentBlob.sha,
      },
    ],
  });

  return subTree;
}

async function createCommit(git, repo, parent, tree, message) {
  const { data: commit } = await git.createCommit({
    ...repo,
    message,
    tree: tree.sha,
    parents: [parent.sha],
  });

  return commit;
}

async function pointRefToCommit(git, repo, ref, commit) {
  const {
    data: { object: updatedRef },
  } = await git.updateRef({ ...repo, ref, sha: commit.sha });

  return updatedRef;
}
