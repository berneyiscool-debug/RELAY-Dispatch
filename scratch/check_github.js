async function checkGithub() {
  console.log("Checking GitHub commits...");
  const response = await fetch('https://api.github.com/repos/berneyiscool-debug/simproclone/commits');
  if (response.status !== 200) {
    console.error("Failed to fetch commits, status =", response.status, await response.text());
    return;
  }
  const commits = await response.json();
  console.log("Latest 3 commits on GitHub:");
  commits.slice(0, 3).forEach(c => {
    console.log(`- Commit: ${c.sha.slice(0, 7)}`);
    console.log(`  Message: ${c.commit.message}`);
    console.log(`  Date: ${c.commit.author.date}`);
  });
}
checkGithub();
