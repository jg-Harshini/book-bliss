def test_delete_author(driver):
    wait_for_angular(driver)
    
    # Wait for author card
    author_card = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located(
            (By.XPATH, "//div[@class='author-card' and .//strong[contains(text(),'Joanne Rowling')]]")
        )
    )

    # Click Delete
    author_card.find_element(By.CSS_SELECTOR, ".delete-btn").click()
    
    # Handle confirm popup
    alert = driver.switch_to.alert
    alert.accept()
    
    wait_for_angular(driver)

    # Check card is gone
    remaining = driver.find_elements(
        By.XPATH, "//div[@class='author-card' and .//strong[contains(text(),'Joanne Rowling')]]"
    )
    assert len(remaining) == 0
