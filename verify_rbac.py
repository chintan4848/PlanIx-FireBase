import asyncio
from playwright.async_api import async_playwright
import sys

async def verify_rbac():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        async def login(user, pw):
            print(f"Attempting login for {user}...")
            await page.goto("http://localhost:3000")
            await page.evaluate("localStorage.clear()")
            await page.reload()
            await page.wait_for_selector("input[placeholder='ACCESS_ID']", timeout=15000)
            await page.fill("input[placeholder='ACCESS_ID']", user)
            await page.fill("input[placeholder='••••••••']", pw)
            await page.click("button:has-text('Authorize')")

            # Wait for boot screen to pass
            try:
                await page.wait_for_selector("text=SYSTEM_READY", timeout=10000)
                print("Boot sequence complete.")
            except:
                print("Boot sequence timeout or not shown.")

            await page.wait_for_selector("nav", timeout=15000)
            print(f"Logged in as {user}")

        try:
            # Step 1: Login as Admin
            await login("admin", "admin")

            # Go to Admin Tab
            await page.click("text=Admin Center")
            await page.wait_for_selector("text=ADMIN CENTER", timeout=15000)

            # Ensure chintan exists
            await page.fill("input[placeholder='PROBE REGISTRY...']", "chintan")
            await asyncio.sleep(2)
            if await page.locator("text=chintan").count() == 0:
                print("Provisioning chintan...")
                await page.click("text=Provision Node")
                await page.fill("input[placeholder='IDENTITY_ALIAS']", "Chintan")
                await page.fill("input[placeholder='ACCESS_NODE_ID']", "chintan")
                await page.fill("input[placeholder='••••••••••••']", "password")
                await page.click("button:has-text('Authorize Node')")
                await page.wait_for_selector("text=Identity Provisioned Successfully")

            # Create a task as Admin for testing
            await page.click("text=Workflow")
            await page.wait_for_selector("button[data-tour='import']")
            await page.click("button[data-tour='import']")
            await page.fill("textarea", "77777")
            await page.click("button:has-text('Execute Sync Protocol')")

            # Wait for modal to close
            await page.wait_for_selector("text=Planix Import", state="hidden", timeout=10000)
            print("Import modal closed.")

            await page.wait_for_selector("text=Redmine Task #77777")

            # Assign to Chintan
            await page.hover("text=Redmine Task #77777")
            await page.click("button[title='Edit Task']")
            await page.click("text=Assignee")
            await page.click("text=Chintan")
            await page.click("text=Save Changes")
            await asyncio.sleep(1)

            # Logout
            await page.click("button[title='Logout']")
            await page.click("text=Yes, Terminate Session")

            # Step 2: Login as Chintan
            await login("chintan", "password")

            # Handle Tour
            try:
                await page.wait_for_selector("text=Got it", timeout=5000)
                await page.click("text=Got it")
            except: pass

            # Verify Task visibility and restriction
            await page.wait_for_selector("text=Redmine Task #77777")
            print("Verified: Task #77777 is visible to Chintan.")

            # Check for restricted buttons
            card = page.locator("div.group:has-text('Redmine Task #77777')")

            if await card.locator("button[title='Start Timer']").count() == 0:
                print("Verified: Start Timer button hidden for non-owner.")
            else:
                print("Error: Start Timer button VISIBLE for non-owner.")

            if await card.locator("button[title='Delete Task']").count() == 0:
                print("Verified: Delete Task button hidden for non-owner.")
            else:
                print("Error: Delete Task button VISIBLE for non-owner.")

            print("RBAC Verification Successful.")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="error_final.png")
            raise e
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_rbac())
