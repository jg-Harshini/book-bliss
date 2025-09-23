import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--start-maximized")
    # options.add_argument("--headless")  # Uncomment if you want headless mode
    service = Service()  # Assumes chromedriver is in PATH
    driver = webdriver.Chrome(service=service, options=options)
    driver.get("http://localhost:8000/author.html")  # Change if your server runs on another port
    yield driver
    driver.quit()
