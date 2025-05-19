// update-toast-imports.js
const fs = require('fs');
const path = require('path');

// List of files to update (from our earlier search results)
const filesToUpdate = [
  'app/onboarding/recruiter-profile/page.tsx',
  'app/onboarding/page.tsx',
  'app/onboarding/candidate-profile/page.tsx',
  'app/auth/signup/page.tsx',
  'app/auth/signin/page.tsx',
  'app/dashboard/candidates/page.tsx',
  'app/dashboard/post-job/page.tsx',
  'app/dashboard/ratings/page.tsx',
  'app/dashboard/settings/page.tsx',
  'app/dashboard/applications/page.tsx',
  'app/dashboard/jobs/[id]/applications/page.tsx',
  'app/dashboard/admin/users/page.tsx',
];

// Function to update import statements in a file
function updateImports(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace import statement
    content = content.replace(
      /import { useToast } from "@\/hooks\/use-toast"/g,
      'import { useRetroToast } from "@/hooks/use-retro-toast"'
    );
    
    // Replace usage of useToast
    content = content.replace(
      /const { toast } = useToast\(\)/g,
      'const { toast } = useRetroToast()'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Update all files
filesToUpdate.forEach(updateImports);

console.log('All files updated successfully.');
