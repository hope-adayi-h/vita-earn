<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

use Saspay\WooCommerce\Saspay_WC_Gateway;

/**
 * Plugin Name: SasPay for WooCommerce
 * Plugin URI: https://docs.saspay.me/
 * Description: Accept payments via Mobile Money and Credit Card in West and Central Africa through a single REST API.
 * Author: SasPay
 * Author URI: https://saspay.me
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Version: 1.0.0
 * Requires at least: 5.6
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 * WC requires at least: 5.8
 * WC tested up to: 9.8
 * Text Domain: saspay-for-woocommerce
 * Domain Path: /languages
 */

const SASPAY_WC_MAIN_FILE = __FILE__;
const SASPAY_WC_VERSION   = '1.0.0';

/**
 * Initialize SasPay Payment Gateway Class.
 */
function saspay_wc_init_gateway_class()
{
    if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
        return;
    }

    require_once plugin_dir_path( __FILE__ ) . 'src/Saspay_WC_Gateway.php';

    add_filter( 'woocommerce_payment_gateways', 'saspay_wc_add_gateway_class' );
}

/**
 * Add SasPay Payment Gateway to WooCommerce.
 *
 * @param array $gateways Payment gateways.
 * @return array
 */
function saspay_wc_add_gateway_class( $gateways )
{
    $gateways[] = Saspay_WC_Gateway::class;
    return $gateways;
}

/**
 * Generate webhook secret upon plugin activation.
 */
function saspay_wc_generate_webhook_secret()
{
    if ( get_option( 'saspay_wc_webhook_secret' ) === false ) {
        $webhook_secret = bin2hex( random_bytes( 16 ) );
        update_option( 'saspay_wc_webhook_secret', $webhook_secret );
    }
}

/**
 * Add action links for the plugin on the plugin page.
 *
 * @param array $links Existing action links.
 * @return array
 */
function saspay_wc_action_links( $links )
{
    $links[] = '<a href="admin.php?page=wc-settings&tab=checkout&section=saspay_wc_gateway">' . esc_html__( 'Settings', 'saspay-for-woocommerce' ) . '</a>';
    $links[] = '<a href="https://docs.saspay.me/" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Docs', 'saspay-for-woocommerce' ) . '</a>';
    $links[] = '<a href="https://app.saspay.me/dashboard/support" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Support', 'saspay-for-woocommerce' ) . '</a>';
    return $links;
}

add_action( 'plugins_loaded', 'saspay_wc_init_gateway_class' );
add_action( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'saspay_wc_action_links' );
register_activation_hook( __FILE__, 'saspay_wc_generate_webhook_secret' );

/**
 * Declare WooCommerce feature compatibility.
 */
add_action(
    'before_woocommerce_init',
    function () {
        if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', __FILE__, true );
        }
    }
);

/**
 * Registers WooCommerce Blocks integration.
 */
function saspay_wc_gateway_block_support()
{
    if ( class_exists( \Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType::class ) ) {
        require_once __DIR__ . '/src/Saspay_WC_Gateway_Blocks.php';

        add_action(
            'woocommerce_blocks_payment_method_type_registration',
            static function ( Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry ) {
                $payment_method_registry->register( new \Saspay\WooCommerce\Saspay_WC_Gateway_Blocks() );
            }
        );
    }
}
add_action( 'woocommerce_blocks_loaded', 'saspay_wc_gateway_block_support' );
