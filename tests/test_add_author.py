import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def wait_for_angular(driver):
    WebDriverWait(driver, 20).until(
        lambda d: d.execute_script(
            'return angular.element(document.body).injector().get("$http").pendingRequests.length === 0'
        )
    )

def test_add_author(driver):
    wait_for_angular(driver)
    
    # Fill form
    driver.find_element(By.CSS_SELECTOR, "input[ng-model='author.name']").send_keys("J.K. Rowling")
    driver.find_element(By.CSS_SELECTOR, "input[ng-model='author.detail']").send_keys("Famous author of Harry Potter series")
    driver.find_element(By.CSS_SELECTOR, "input[ng-model='author.genre']").send_keys("Fantasy")
    driver.find_element(By.CSS_SELECTOR, "input[ng-model='author.debutYear']").send_keys("1997")
    driver.find_element(By.CSS_SELECTOR, "input[ng-model='author.photo']").send_keys("https://example.com/jkrowling.jpg")

    # Submit form
    driver.find_element(By.XPATH, "//button[contains(text(),'Add Author')]").click()

    # Wait for Angular + author card
    wait_for_angular(driver)
    
    author_card = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located(
            (By.XPATH, "//div[@class='author-card' and .//strong[contains(text(),'J.K. Rowling')]]")
        )
    )
    assert author_card is not None
