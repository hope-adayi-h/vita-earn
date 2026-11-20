=== SasPay for WooCommerce ===
Contributors: Nirdans
Tags: woocommerce, payments, mobile money, credit card, africa
Requires at least: 5.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Accept Mobile Money, card, and bank transfer payments in West and Central Africa via SasPay.

== Description ==

**SasPay for WooCommerce** connects your WooCommerce store to the [SasPay](https://saspay.me) payment platform so customers can pay with Mobile Money, bank cards, bank transfers, and other local methods through a single integration.

This plugin is a client for the SasPay API (Software as a Service). Payment processing is performed by SasPay; this plugin creates checkout sessions, redirects customers to SasPay's hosted payment page, and updates WooCommerce orders when payment is confirmed (return URL and webhooks).

= Features =

* Classic WooCommerce checkout and Cart / Checkout Blocks support
* Redirect to SasPay hosted checkout
* Automatic order status updates via return URL and webhooks
* Compatible with WooCommerce High-Performance Order Storage (HPOS)

= External service =

This plugin sends order and customer data to SasPay when a customer chooses SasPay at checkout and when the store verifies payment status.

* Service: [SasPay](https://saspay.me)
* API endpoint: `https://api.saspay.me/api/v1/`
* Documentation: [https://docs.saspay.me/](https://docs.saspay.me/)
* Terms of use: [https://saspay.me/terms](https://saspay.me/terms)
* Privacy policy: [https://saspay.me/privacy](https://saspay.me/privacy)

Data typically transmitted includes order amount, currency, order reference, customer name, email, phone, and billing country, plus metadata needed to match the WooCommerce order. A SasPay API key (configured in the plugin settings) is required. By installing, activating, and configuring this plugin with your SasPay credentials, you consent to this communication with SasPay's servers for payment processing.

You need a SasPay merchant account. Fees and account terms are defined by SasPay, not by this plugin. All plugin features included in this package are available without artificial restrictions (no trial lock, paywall, or usage quota inside the plugin code).

= Requirements =

* WordPress 5.6 or later
* WooCommerce 5.8 or later
* PHP 7.4 or later
* HTTPS / SSL recommended for checkout
* A SasPay API key (`sk_test_…` or `sk_live_…`)

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/saspay-for-woocommerce`, or install the zip via **Plugins → Add New → Upload Plugin**.
2. Activate **SasPay for WooCommerce** through the **Plugins** menu.
3. Ensure WooCommerce is installed and active.
4. Go to **WooCommerce → Settings → Payments → SasPay for WooCommerce**.
5. Enable the gateway and enter your SasPay secret API key.
6. Copy the webhook URL shown in the settings into your [SasPay dashboard](https://app.saspay.me/) webhook configuration.
7. (Optional) Copy the webhook secret into your SasPay dashboard if your account requires it.

== Frequently Asked Questions ==

= Does this plugin charge fees? =

The plugin itself is free and open source under GPLv2 or later. Payment processing fees are charged by SasPay according to your merchant agreement.

= Is customer data sent to a third party? =

Yes. When SasPay is used at checkout, order and customer payment details required to process the payment are sent to SasPay's API. See the External service section above and SasPay's privacy policy.

= Does it work with the WooCommerce block checkout? =

Yes. The plugin registers a payment method for Cart and Checkout Blocks.

= Where can I get support? =

* Documentation: [https://docs.saspay.me/](https://docs.saspay.me/)
* Support: [https://app.saspay.me/dashboard/support](https://app.saspay.me/dashboard/support)

== Screenshots ==

1. Payment gateway settings in WooCommerce.
2. SasPay option on the checkout page.

== Changelog ==

= 1.0.0 =
* Initial release.
* Classic checkout and Blocks checkout support.
* Checkout session creation, return handling, and webhooks.
* HPOS compatibility declared.

== Upgrade Notice ==

= 1.0.0 =
Initial public release.
