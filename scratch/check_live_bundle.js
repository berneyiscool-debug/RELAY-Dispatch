async function checkLiveBundle() {
  const url = 'https://relay-dispatch.netlify.app/assets/index--aK1wZ_f.js';
  console.log("Fetching live bundle:", url);
  const response = await fetch(url);
  const code = await response.text();
  
  const hasTableColumns = code.includes("TABLE_COLUMNS");
  const hasContractorMapping = code.includes("contractors") && code.includes("businessName");
  
  console.log("Contains TABLE_COLUMNS:", hasTableColumns);
  console.log("Contains contractor/businessName mapping:", hasContractorMapping);
  
  // Print a small snippet around where "formTemplates" is mentioned to see the code state
  const idx = code.indexOf("formTemplates");
  if (idx !== -1) {
    console.log("\nSnippet around formTemplates:");
    console.log(code.slice(idx - 100, idx + 200));
  } else {
    console.log("formTemplates not found in bundle");
  }
}
checkLiveBundle();
