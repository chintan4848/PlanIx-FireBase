import os
import time
from playwright.sync_api import Page, expect, sync_playwright

def test_admin_center_crash(page: Page):
    # 1. Login
    page.goto("http://localhost:3005")

    # Wait for login modal
    # In LoginModal.tsx, placeholder is "ACCESS_ID"
    page.wait_for_selector("input[placeholder='ACCESS_ID']", timeout=10000)

    page.fill("input[placeholder='ACCESS_ID']", "admin")
    page.fill("input[placeholder='••••••••']", "admin")
    page.click("button:has-text('Authorize')")

    # Wait for dashboard
    page.wait_for_selector("text=Planix", timeout=10000)

    # 2. Navigate to Admin Center
    # Click on 'Admin Center' link in sidebar
    # The button text is "Admin Center" based on translations.ts
    admin_link = page.get_by_role("button", name="Admin Center")
    admin_link.click()

    # 3. Check for error or successful load
    time.sleep(2)
    page.screenshot(path="/home/jules/verification/admin_center_after_click.png")

    # Check for Admin Dashboard elements
    # AdminDashboard.tsx has <h1>ADMIN <span className="text-indigo-600 italic">CENTER</span></h1>
    expect(page.locator("h1:has-text('ADMIN')")).to_be_visible()
    expect(page.locator("h1:has-text('CENTER')")).to_be_visible()

if __name__ == "__main__":
    os.makedirs("/home/jules/verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_admin_center_crash(page)
            print("Admin Center loaded successfully")
        except Exception as e:
            print(f"Error occurred: {e}")
            page.screenshot(path="/home/jules/verification/error_screenshot.png")
            # Log the page content to see what's happening
            with open("/home/jules/verification/page_content.html", "w") as f:
                f.write(page.content())
        finally:
            browser.close()
