# Fix Frontend Build on Render

## Problem Analysis

**Issue**: Frontend won't build on Render deployment

**Root Cause**: Render is executing `npm install` as the build command instead of the complete build command that includes building the frontend React application.

**Evidence from logs**:
```
==> Running build command 'npm install'...
```

Then at runtime:
```
Error: ENOENT: no such file or directory, stat '/opt/render/project/src/frontend/build/index.html'
```

**Expected behavior**: The build command should be:
```bash
npm install && cd frontend && npm install && npm run build
```

This command is correctly defined in `render.yaml:6` but Render is not using it.

## Root Cause

Render service configuration in the dashboard is likely set with a manual build command that overrides the `render.yaml` file. When a service is configured manually in the Render dashboard, those settings take precedence over the `render.yaml` file.

## Solution

Update the Render service configuration in the dashboard to use the correct build command that builds both backend and frontend.

---

## Implementation Steps

### [x] Step: Planning
Analysis complete and plan created.

### [ ] Step: Verify Current Configuration
<!-- chat-id: 859f5acb-8f62-42da-98dd-03e6e439e209 -->
Confirm the issue by checking:
1. The `render.yaml` file has the correct build command (already verified: line 6)
2. The server code expects to serve from `frontend/build/` directory (already verified: index.js:672-675)
3. Document findings

### [ ] Step: Update Render Dashboard Configuration
<!-- chat-id: 202af136-1268-4cf2-998b-7bd9b4d9be37 -->

**Action**: Update the Render service build command in the dashboard

**Instructions for user**:
1. Log in to Render dashboard at https://dashboard.render.com
2. Navigate to the "FaceShot-ChopShop-web" service
3. Go to Settings
4. Find the "Build Command" field
5. Update it to: `npm install && cd frontend && npm install && npm run build`
6. Save changes
7. Trigger a manual deploy to test the fix

**Alternative**: If the service is configured to use render.yaml, ensure:
- The render.yaml file is in the root of the repository
- The service is set to "Infrastructure as Code" mode in Render settings

### [ ] Step: Verify Deployment

After updating the build command:
1. Monitor the build logs to confirm the frontend build runs
2. Check for successful creation of `frontend/build/` directory
3. Verify the application loads without ENOENT errors
4. Test the frontend loads correctly in the browser

**Expected log output**:
```
==> Running build command 'npm install && cd frontend && npm install && npm run build'...
npm install (backend)
npm install (frontend)  
npm run build (frontend - creates build/ directory)
==> Build successful 🎉
```

**Expected runtime behavior**:
- No ENOENT errors in logs
- Frontend serves correctly at the root URL
- Static files load from `frontend/build/`

---

## Notes

- This is a configuration issue, not a code issue
- All code is correct (render.yaml, package.json, index.js)
- The fix requires dashboard configuration change only
- No code changes needed unless we want to add additional safeguards or logging
