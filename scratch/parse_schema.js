import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve('supabase/migrations/schema.sql');
const content = fs.readFileSync(schemaPath, 'utf-8');

const tables = {};
let currentTable = null;

content.split('\n').forEach(line => {
  const createTableMatch = line.match(/CREATE TABLE\s+(\w+)\s*\(/i);
  if (createTableMatch) {
    currentTable = createTableMatch[1];
    tables[currentTable] = [];
    return;
  }

  if (currentTable) {
    if (line.trim().startsWith(');')) {
      currentTable = null;
      return;
    }
    
    // Check for column definition (usually starts with spaces and column name, then type)
    const colMatch = line.trim().match(/^(\w+)\s+([a-zA-Z\s]+(\([^)]+\))?)/);
    if (colMatch) {
      const colName = colMatch[1];
      if (['primary', 'foreign', 'constraint', 'references', 'unique', 'check'].includes(colName.toLowerCase())) {
        return;
      }
      tables[currentTable].push(colName);
    }
  }
});

console.log(JSON.stringify(tables, null, 2));
