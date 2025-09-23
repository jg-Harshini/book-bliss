def test_edit_author(driver):
    wait_for_angular(driver)
    
    # Wait for author card
    author_card = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located(
            (By.XPATH, "//div[@class='author-card' and .//strong[contains(text(),'J.K. Rowling')]]")
        )
    )

    # Click Edit
    author_card.find_element(By.CSS_SELECTOR, ".edit-btn").click()
    wait_for_angular(driver)

    # Change name
    author_card.find_element(By.CSS_SELECTOR, "input[ng-model='a.name']").clear()
    author_card.find_element(By.CSS_SELECTOR, "input[ng-model='a.name']").send_keys("Joanne Rowling")

    # Save
    author_card.find_element(By.XPATH, ".//button[contains(text(),'Save')]").click()
    wait_for_angular(driver)

    # Verify update
    updated_card = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located(
            (By.XPATH, "//div[@class='author-card' and .//strong[contains(text(),'Joanne Rowling')]]")
        )
    )
    assert updated_card is not None
