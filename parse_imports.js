const fs = require('fs');
const file = fs.readFileSync('C:/Users/Acer/.gemini/antigravity-ide/brain/157b3a28-6429-4daf-b03a-1771dbdda6d6/.system_generated/steps/1297/content.md', 'utf8');
const jsonStart = file.indexOf('{');
const data = JSON.parse(file.slice(jsonStart));
const map = {};
data.files.forEach(f => {
  const lines = f.content.split('\n');
  lines.forEach(l => {
    if (l.includes('from "@/') || l.includes("from '@/")) {
      const match = l.match(/from\s+['"]([^'"]+)['"]/);
      if (match) {
        map[match[1]] = (map[match[1]] || 0) + 1;
      }
    }
  });
});
console.log(JSON.stringify(map, null, 2));
