// audit_codebase.js
// Simple script to audit Velvet Lane codebase structure and generate a report.
// It scans the src directory for pages, API routes, components, and Prisma models (if using Prisma).
// Generates a markdown report: navigation_audit_report.md

const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');
const reportPath = path.resolve(__dirname, '..', 'navigation_audit_report.md');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

function categorizeFiles(files) {
  const pages = [];
  const apiRoutes = [];
  const components = [];
  const models = [];

  files.forEach((file) => {
    const rel = path.relative(srcDir, file).replace(/\\/g, '/');
    if (rel.startsWith('app/') && (rel.endsWith('/page.tsx') || rel.endsWith('/page.jsx') || rel.endsWith('/page.js') || rel.endsWith('/page.ts')) ) {
      pages.push(rel);
    } else if (rel.startsWith('app/api/') && (rel.endsWith('.ts') || rel.endsWith('.js'))) {
      apiRoutes.push(rel);
    } else if (rel.includes('/components/') && (rel.endsWith('.tsx') || rel.endsWith('.jsx') || rel.endsWith('.ts') || rel.endsWith('.js'))) {
      components.push(rel);
    } else if (rel.startsWith('prisma/') && rel.endsWith('.prisma')) {
      models.push(rel);
    }
  });
  return { pages, apiRoutes, components, models };
}

function generateReport({ pages, apiRoutes, components, models }) {
  let md = '# Velvet Lane Codebase Audit Report\n\n';
  md += '## Pages (Next.js routing)\n';
  pages.forEach(p => md += `- ${p}\n`);
  md += '\n## API Routes\n';
  apiRoutes.forEach(a => md += `- ${a}\n`);
  md += '\n## Components\n';
  components.forEach(c => md += `- ${c}\n`);
  md += '\n## Prisma Models\n';
  models.forEach(m => md += `- ${m}\n`);
  md += '\n---\nGenerated on ' + new Date().toISOString();
  return md;
}

function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found at', srcDir);
    process.exit(1);
  }
  const allFiles = walk(srcDir);
  const categorized = categorizeFiles(allFiles);
  const report = generateReport(categorized);
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log('Audit report written to', reportPath);
}

main();
