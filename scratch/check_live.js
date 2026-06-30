async function checkLive() {
  const response = await fetch('https://relay-dispatch.netlify.app');
  const html = await response.text();
  console.log("--- Live index.html ---");
  console.log(html);
}
checkLive();
