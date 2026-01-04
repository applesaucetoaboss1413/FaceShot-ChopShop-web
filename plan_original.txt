# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [ ] Step 1: Database Schema Updates and Authentication Backend
<!-- chat-id: c952921e-2180-4488-9732-11338fe8e738 -->

**Objective**: Implement the authentication system foundation

**Tasks**:
1. Update database schema to add email/password authentication fields
2. Implement POST `/api/auth/signup` endpoint with bcrypt password hashing
3. Implement POST `/api/auth/login` endpoint with JWT token generation
4. Implement GET `/api/auth/me` endpoint using existing authenticateToken middleware
5. Add transaction support for credit deduction to prevent race conditions

**Verification**:
- Test signup with curl/Postman
- Test login and verify JWT token is returned
- Test /api/auth/me with valid and invalid tokens
- Verify user_credits entry is created on signup

---

### [ ] Step 2: A2E Service Integration
<!-- chat-id: 37e74846-a830-4402-ac1f-0ed6efa6a806 -->

**Objective**: Create A2E API client service and integrate with catalog types

**Tasks**:
1. Create `services/a2e.js` with A2EService class
2. Implement authentication using Bearer token
3. Implement method mapping for catalog types:
   - faceswap → `/api/v1/userFaceSwapTask/add`
   - img2vid → `/api/v1/userImage2Video/start`
   - enhance, bgremove, avatar → appropriate A2E endpoints or placeholders
4. Implement status checking methods for each task type
5. Add error handling and logging

**Verification**:
- Test A2E API directly with test API key
- Verify each catalog type can start a task
- Verify status polling returns correct data
- Check error handling with invalid API key

---

### [ ] Step 3: Update Job Processing and Background Polling
<!-- chat-id: dba290b1-d7a3-4815-8bbc-c91301099ba1 -->

**Objective**: Update `/api/web/process` to call A2E API and implement background polling

**Tasks**:
1. Update `jobs` table schema to include: a2e_task_id, result_url, error_message, cost_credits
2. Modify `/api/web/process` to:
   - Verify user credits before processing
   - Fetch uploaded media URL from miniapp_creations
   - Call A2E service to start task
   - Create job record with a2e_task_id
   - Deduct credits using transaction
3. Implement background polling mechanism with setInterval
4. Update polling to write result_url and status to database
5. Implement cleanup for completed/failed jobs to stop polling

**Verification**:
- Upload an image via `/api/web/upload`
- Process job via `/api/web/process`
- Verify A2E task is created and task_id is stored
- Verify credits are deducted
- Watch database for status updates from polling
- Verify polling stops when task completes

---

### [ ] Step 4: Update Status and Creations Endpoints
<!-- chat-id: 215659a1-de9b-4608-835a-2573feab7249 -->

**Objective**: Update frontend-facing endpoints to return A2E results

**Tasks**:
1. Modify `/api/web/status` to return result_url and cost_credits
2. Modify `/api/web/creations` to join jobs table and return result_url instead of upload url for completed jobs
3. Update error handling to return meaningful error messages

**Verification**:
- Call `/api/web/status?id=<job_id>` for completed job
- Verify result_url is returned
- Call `/api/web/creations` and verify completed jobs show result media
- Test error cases (invalid id, not found, etc.)

---

### [ ] Step 5: Frontend Updates
<!-- chat-id: 94f6714a-f2b2-4b8b-856b-440982d1481f -->

**Objective**: Remove Telegram login and update UI for email authentication

**Tasks**:
1. Remove TelegramLoginButton from `frontend/src/pages/Landing.js`
2. Update `frontend/src/pages/Dashboard.js` to show user email instead of first_name
3. Update `frontend/src/pages/FAQs.js` to remove Telegram reference
4. Add prompt/negative_prompt input fields to `frontend/src/pages/Create.js` for img2vid type
5. Update Create page to pass options to processJob API call

**Verification**:
- Visit landing page, verify no Telegram login button
- Sign up and login, verify dashboard shows email
- Visit FAQs, verify no Telegram references
- Create img2vid job, verify prompt inputs appear and are sent to backend

---

### [ ] Step 6: Deployment Configuration
<!-- chat-id: 8d4a0f8e-8281-42a7-b67e-a8158ec5173d -->

**Objective**: Update deployment settings for Render

**Tasks**:
1. Update `render.yaml` buildCommand to use `npm install` instead of `npm ci`
2. Add A2E_API_KEY and A2E_BASE_URL environment variables to Render dashboard
3. Verify all required environment variables are set
4. Test local build with production settings

**Verification**:
- Run `npm install && cd frontend && npm install && npm run build` locally
- Verify build succeeds
- Push to GitHub and verify Render auto-deploys successfully
- Check Render logs for any errors

---

### [ ] Step 7: End-to-End Testing and Documentation
<!-- chat-id: 6091a8c9-3a4a-467d-9f84-ad5a5061bbe9 -->

**Objective**: Verify complete user flow and document solution

**Tasks**:
1. Test complete flow on production:
   - Sign up new user
   - Purchase credits via Stripe
   - Upload image
   - Process job (img2vid)
   - Monitor status page
   - Verify result appears in dashboard
2. Test all catalog types (faceswap, avatar, enhance, bgremove)
3. Test error scenarios:
   - Insufficient credits
   - Invalid file uploads
   - A2E API failures
4. Write completion report to `{@artifacts_path}/report.md`

**Verification**:
- All catalog types work end-to-end
- Stripe payments update credits correctly
- A2E integration works for all supported types
- Error handling works correctly
- No console errors or warnings in production
