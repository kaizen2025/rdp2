from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        # Laisser le temps au serveur de démarrer
        time.sleep(25)
        page.goto("http://localhost:3000/login", timeout=20000)
        page.get_by_label("Nom d'utilisateur").fill("admin")
        page.get_by_label("Mot de passe").fill("admin")
        page.get_by_role("button", name="Connexion").click()
        page.wait_for_url("http://localhost:3000/sessions", timeout=10000)
        # Attendre que les données soient probablement chargées
        time.sleep(5)
        page.screenshot(path="jules-scratch/verification/sessions_page_final.png")
        print("Screenshot taken successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
