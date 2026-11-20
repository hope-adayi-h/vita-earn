# SasPay for WooCommerce

Accept payments via **Mobile Money** and **Credit Card** in West and Central Africa through a single REST API.

## Features

- 🛒 Classic WooCommerce checkout and Cart / Checkout **Blocks** support
- 🔗 Redirect to SasPay hosted checkout page
- 🔄 Automatic order status updates via return URL and webhooks
- ⚡ Compatible with WooCommerce **High-Performance Order Storage** (HPOS)

## Requirements

- WordPress 5.6+
- WooCommerce 5.8+
- PHP 7.4+
- HTTPS / SSL recommended
- A SasPay API key (`sk_test_…` or `sk_live_…`)

## Installation

1. Upload the plugin folder to `/wp-content/plugins/saspay-for-woocommerce`, or install the zip via **Plugins → Add New → Upload Plugin**.
2. Activate **SasPay for WooCommerce** through the **Plugins** menu.
3. Go to **WooCommerce → Settings → Payments → SasPay for WooCommerce**.
4. Enable the gateway and enter your SasPay secret API key.
5. Copy the **Webhook URL** shown in the settings into your [SasPay dashboard](https://app.saspay.me/) webhook configuration.

## Links

- 📖 [Documentation](https://docs.saspay.me/)
- 🖥️ [Dashboard](https://app.saspay.me/)
- 🆘 [Support](https://app.saspay.me/dashboard/support)

## License

GPLv2 or later — see [LICENSE](LICENSE) for details.
