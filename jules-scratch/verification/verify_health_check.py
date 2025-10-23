from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        # Attendre que le serveur de développement soit prêt
        time.sleep(20)
        page.goto("http://localhost:3000/login", timeout=20000)
        page.screenshot(path="jules-scratch/verification/login_page_status.png")
        print("Screenshot taken successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
