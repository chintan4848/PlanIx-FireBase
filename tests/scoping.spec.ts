import { test, expect } from '@playwright/test';

test('Data scoping verification', async ({ page }) => {
  await page.goto('http://localhost:3002/');

  // 1. Register a Member
  await page.click('button:has-text("Register")');
  await page.fill('input[placeholder="FULL_NAME"]', 'Member One');
  await page.fill('input[placeholder="IDENTITY_ALIAS"]', 'member1');
  await page.fill('input[placeholder="••••••••••••"]', 'password123');
  await page.click('button:has-text("Authorize Node")');

  // Wait for login to complete and board to show
  await page.waitForSelector('text=Member One');

  // Create a task for Member One
  await page.click('[data-tour="sidebar"] >> text=Protocol'); // Click on workspace to ensure it's loaded
  await page.click('button:has-text("Execute") >> xpath=../../..//textarea'); // Find the textarea in the new task modal if it was open
  // Actually, let's use the "Plus" button
  await page.click('button:has-text("To Do") >> xpath=.. >> button >> svg >> xpath=.. >> xpath=.. >> button:has-child(svg[class*="lucide-plus"])');
  await page.fill('textarea[placeholder*="Redmine IDs"]', '1001');
  await page.click('button:has-text("Execute")');

  await page.waitForSelector('text=#1001');

  // 2. Logout
  await page.click('button:has-text("Member One")');
  await page.click('button:has-text("Logout")');
  await page.click('button:has-text("Confirm Termination")');

  // 3. Register an Admin
  await page.click('button:has-text("Register")');
  await page.fill('input[placeholder="FULL_NAME"]', 'Admin One');
  await page.fill('input[placeholder="IDENTITY_ALIAS"]', 'admin1');
  await page.fill('input[placeholder="••••••••••••"]', 'adminpass');
  await page.click('button:has-text("Authorize Node")');

  await page.waitForSelector('text=Admin One');

  // Change Admin One's role to Admin (currently defaults to Member on registration)
  // Wait, I can't change it easily without being an admin already.
  // App.tsx has a useEffect that registers a temporary admin.
  // Let's use THAT admin if possible.
  // But I don't know the credentials.

  // Actually, AuthService.register defaults role to 'Member'.
  // I need an Admin to test Admin features.
  // The INITIAL_ADMIN has username 'admin' and password 'admin'.

  // Let's try logging in as INITIAL_ADMIN.
  await page.click('button:has-text("Admin One")');
  await page.click('button:has-text("Logout")');
  await page.click('button:has-text("Confirm Termination")');

  await page.fill('input[placeholder="IDENTITY_ALIAS"]', 'admin');
  await page.fill('input[placeholder="••••••••••••"]', 'admin');
  await page.click('button:has-text("Authorize Node")');

  await page.waitForSelector('text=System Administrator');

  // 4. Go to Admin Center
  await page.click('button:has-text("Admin Center")');

  // 5. Verify Member One is NOT in the registry
  const registryText = await page.textContent('body');
  expect(registryText).not.toContain('Member One');
  expect(registryText).toContain('System Administrator');

  // 6. Verify Workload Units (Tasks)
  // System Administrator shouldn't see Member One's task #1001
  const workloadText = await page.textContent('text=Workload Units >> xpath=.. >> h4');
  // It might be 0 or more if there are other tasks, but #1001 shouldn't be counted in the background if the logic is correct.
  // Wait, the logic for "Workload Units" in AdminDashboard uses TaskService.getAllTasksForAdmin().
  // If I'm an Admin, it should return only tasks belonging to Admins.
  // Since Member One is NOT an admin, their task #1001 should not be returned.

  console.log('Workload Units:', workloadText);
  // We can't easily assert on the exact number without knowing the initial state,
  // but we can check if #1001 is listed if there was a list.
  // AdminDashboard doesn't list tasks, just shows the count.

  // Let's create a task for Admin and see if it's counted.
  await page.click('button:has-text("Workflow")');
  await page.click('button:has-text("To Do") >> xpath=.. >> button >> svg >> xpath=.. >> xpath=.. >> button:has-child(svg[class*="lucide-plus"])');
  await page.fill('textarea[placeholder*="Redmine IDs"]', '2001');
  await page.click('button:has-text("Execute")');
  await page.waitForSelector('text=#2001');

  await page.click('button:has-text("Admin Center")');
  const workloadTextAfter = await page.textContent('text=Workload Units >> xpath=.. >> h4');
  console.log('Workload Units After:', workloadTextAfter);

  // Take a screenshot
  await page.screenshot({ path: 'admin_dashboard.png' });
});
