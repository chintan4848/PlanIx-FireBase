from playwright.sync_api import Page, expect, sync_playwright
import time
import random

def test_rbac_and_admin_dashboard(page: Page):
    # 1. Login as Admin
    page.goto("http://localhost:3000")

    # Wait for login modal
    page.wait_for_selector("text=Sign In")

    # Fill login
    page.get_by_placeholder("Username").fill("admin")
    page.get_by_placeholder("Password").fill("admin")
    page.click("button:has-text('Authorize Session')")

    # Wait for boot sequence
    page.wait_for_selector("text=SYSTEM_READY", timeout=30000)
    print("Logged in as admin")

    # 2. Check Admin Center
    # Use text=Admin Center since translations.ts has it
    admin_center_tab = page.locator("button:has-text('Admin Center')")
    expect(admin_center_tab).to_be_visible()
    admin_center_tab.click()

    # Check if Admin Dashboard loaded without crash
    page.wait_for_selector("text=Identity Registry", timeout=10000)
    print("Admin Center loaded successfully")
    page.screenshot(path="verification_admin_center.png")

    # 3. Create a task for another user to test RBAC (if needed)
    # Actually, let's just check if we can see the "Admin Center" as a member

    # Logout
    page.click("button[data-tour='user']") # Go to profile
    # Actually there is a logout button in TopNav but let's use the one in Profile if it exists or just refresh and clear localstorage
    page.evaluate("localStorage.clear()")
    page.goto("http://localhost:3000")

    # 4. Login as Member
    page.wait_for_selector("text=Sign In")
    page.get_by_placeholder("Username").fill("chintan")
    page.get_by_placeholder("Password").fill("password")
    page.click("button:has-text('Authorize Session')")

    page.wait_for_selector("text=SYSTEM_READY", timeout=30000)
    print("Logged in as member (chintan)")

    # Member should NOT see Admin Center
    admin_center_tab = page.locator("button:has-text('Admin Center')")
    expect(admin_center_tab).not_to_be_visible()
    print("Admin Center is hidden for member")

    # 5. Check "Workflow" tab (Board)
    workflow_tab = page.locator("button:has-text('Workflow')")
    expect(workflow_tab).to_be_visible()
    workflow_tab.click()

    # Check if member sees only their tasks (or assigned)
    # We'll just take a screenshot of the workflow
    page.wait_for_selector("text=To Do")
    page.screenshot(path="verification_member_workflow.png")

    print("Verification complete")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to something standard
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        try:
            test_rbac_and_admin_dashboard(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()
