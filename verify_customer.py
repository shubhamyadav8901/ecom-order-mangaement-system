from playwright.sync_api import sync_playwright
import time
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        # Mock API endpoints
        def handle_login(route):
            print("Intercepted Login")
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"accessToken": "fake-jwt-token"})
            )

        def handle_products(route):
            print("Intercepted Products")
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([
                    {"id": 1, "name": "Test Product", "description": "Description", "price": 100.0}
                ])
            )

        def handle_inventory(route):
            print("Intercepted Inventory")
            # Expecting a POST with body [1]
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"1": 10})
            )

        def handle_orders_post(route):
            print("Intercepted Order Checkout")
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"id": 123, "status": "CREATED"})
            )

        def handle_orders_get(route):
            print("Intercepted My Orders")
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([
                    {"id": 123, "status": "PAID", "totalAmount": 100.0, "createdAt": "2023-01-01T00:00:00Z", "items": [{"productId": 1, "quantity": 1, "price": 100.0}]}
                ])
            )

        def handle_cancel(route):
             print("Intercepted Cancel")
             route.fulfill(status=200)

        # Register routes with patterns matching the Axios base URL (http://localhost:80/api/...)
        # Since frontend is proxied via vite to http://localhost:80, or the axios client defines a base url.
        # Let's check api/client.ts or just use wildcards.

        page.route("**/auth/login", handle_login)
        page.route("**/products", handle_products)
        page.route("**/inventory/batch", handle_inventory)
        page.route("**/orders", lambda route: handle_orders_get(route) if route.request.method == "GET" else handle_orders_post(route))
        page.route("**/orders/my-orders", handle_orders_get)
        page.route("**/orders/*/cancel", handle_cancel)

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Login
            print("Waiting for login form...")
            page.wait_for_selector('input[type="email"]')
            page.fill('input[type="email"]', "user@example.com")
            page.fill('input[type="password"]', "password")
            print("Clicking Sign In...")
            page.click('button[type="submit"]')

            # Wait for home page
            print("Waiting for product list...")
            page.wait_for_selector("text=Test Product", timeout=10000)
            print("Product found.")

            # Add to cart
            print("Adding to cart...")
            page.click("text=Add")

            # Go to Cart
            print("Navigating to Cart...")
            page.click('[aria-label="Cart"]')

            # Verify Cart
            print("Verifying Cart...")
            page.wait_for_selector("text=Test Product")
            page.wait_for_selector("button:has-text('Checkout')")

            # Checkout
            print("Clicking Checkout...")
            page.click("button:has-text('Checkout')")

            # Wait for redirect to Orders or check toast
            print("Waiting for orders view...")
            page.wait_for_selector("text=My Orders")
            page.wait_for_selector("text=Order #123")

            # Open Order Details
            print("Opening Order Details...")
            page.click("text=Order #123")

            # Cancel Order
            print("Cancelling Order...")
            page.wait_for_selector("button:has-text('Cancel Order')")
            page.click("button:has-text('Cancel Order')")

            # Verify Toast or reload (mock doesn't change state automatically unless we change the route handler, but we just want to verify the call)
            # The UI calls fetchOrders after cancel, so it will get the same PAID order unless we change the mock.
            # But the toast should appear.
            page.wait_for_selector("text=Order cancelled")

            print("Verification Successful!")

        except Exception as e:
            print(f"Verification Failed: {e}")
            page.screenshot(path="failure.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
