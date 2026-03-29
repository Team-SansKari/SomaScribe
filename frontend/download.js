import fs from 'fs';
import https from 'https';
import path from 'path';

const screens = [
  {
    name: 'PostSessionSummary.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2JjYTUwMzEyZTAzZDQ4YzM4YTM2NDliNzg1NDUyZDVhEgsSBxDzsPOm1BMYAZIBIwoKcHJvamVjdF9pZBIVQhM5NjA0MzM0MDkzMzExNTcwMzQ2&filename=&opi=89354086'
  },
  {
    name: 'ActiveSession.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2Q1MjM2NzQ4MjcyYjQ4MzNiMjM2MzQzZTg0Yjc5Y2UxEgsSBxDzsPOm1BMYAZIBIwoKcHJvamVjdF9pZBIVQhM5NjA0MzM0MDkzMzExNTcwMzQ2&filename=&opi=89354086'
  },
  {
    name: 'InsightTriggered.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzhlN2Y4ZjNlNGVkZDQ4ZjNhY2QwM2E0NDJlYmE3YWM3EgsSBxDzsPOm1BMYAZIBIwoKcHJvamVjdF9pZBIVQhM5NjA0MzM0MDkzMzExNTcwMzQ2&filename=&opi=89354086'
  }
];

const targetDir = path.join(process.cwd(), 'src', 'screens');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function processHtmlToJsx(html, name) {
  // Extract body content if present, else use full string
  let bodyContent = html;
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (match) {
    bodyContent = match[1];
  }

  // Very basic replacements for JSX compatibility
  // Replace class= with className=
  bodyContent = bodyContent.replace(/class=/g, 'className=');
  // Replace for= with htmlFor=
  bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');
  // Add closing tags to self-closing elements that might be unclosed in raw HTML
  bodyContent = bodyContent.replace(/<(img|input|br|hr|link|meta)([^>]*[^/])>/g, '<$1$2/>');
  bodyContent = bodyContent.replace(/<(img|input|br|hr|link|meta)([^>]*)><\/(img|input|br|hr|link|meta)>/g, '<$1$2/>');

  // Fix SVG fill rules
  bodyContent = bodyContent.replace(/fill-rule=/g, 'fillRule=');
  bodyContent = bodyContent.replace(/clip-rule=/g, 'clipRule=');
  bodyContent = bodyContent.replace(/stroke-width=/g, 'strokeWidth=');
  bodyContent = bodyContent.replace(/stroke-linecap=/g, 'strokeLinecap=');
  bodyContent = bodyContent.replace(/stroke-linejoin=/g, 'strokeLinejoin=');

  // Remove comment parsing issues if any style tags are inline (usually stitch outputs tailwind classes)
  bodyContent = bodyContent.replace(/<!--[\s\S]*?-->/g, '');

  const funcName = name.replace('.jsx', '');

  return `import React from 'react';\n\nexport default function ${funcName}() {\n  return (\n    <>\n      ${bodyContent}\n    </>\n  );\n}\n`;
}

screens.forEach(screen => {
  https.get(screen.url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const jsxContent = processHtmlToJsx(data, screen.name);
      const filePath = path.join(targetDir, screen.name);
      fs.writeFileSync(filePath, jsxContent, 'utf8');
      console.log(`Successfully downloaded and converted: ${screen.name}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${screen.name}: `, err.message);
  });
});

