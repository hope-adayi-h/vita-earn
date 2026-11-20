<?php

namespace Saspay\WooCommerce;

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

if (! defined('ABSPATH')) {
    exit;
}

final class Saspay_WC_Gateway_Blocks extends AbstractPaymentMethodType
{
    /**
     * The gateway instance.
     *
     * @var Saspay_WC_Gateway
     */
    private $gateway;

    protected $name = 'saspay_wc_gateway';

    /**
     * Initializes the payment method type.
     */
    public function initialize()
    {
        $gateways       = WC()->payment_gateways->payment_gateways();
        $this->gateway  = $gateways[ $this->name ];
        $this->settings = $this->gateway->settings;
    }

    /**
     * Returns if this payment method should be active. If false, the scripts will not be enqueued.
     */
    public function is_active(): bool
    {
        return $this->gateway->is_available();
    }

    /**
     * Returns an array of scripts/handles to be registered for this payment method.
     */
    public function get_payment_method_script_handles(): array
    {
        $script_path      = 'build/index.js';
        $script_url       = plugins_url( $script_path, SASPAY_WC_MAIN_FILE );
        $asset_path       = plugin_dir_path( SASPAY_WC_MAIN_FILE ) . 'build/index.asset.php';
        $version          = SASPAY_WC_VERSION;
        $dependencies     = array(
            'wc-blocks-registry',
            'wc-settings',
            'wp-element',
            'wp-html-entities',
            'wp-i18n',
        );

        if ( file_exists( $asset_path ) ) {
            $asset = require $asset_path;

            if ( is_array( $asset ) ) {
                $version      = $asset['version'] ?? $version;
                $dependencies = $asset['dependencies'] ?? $dependencies;
            }
        }

        wp_register_script(
            'saspay_wc_gateway-blocks-integration',
            $script_url,
            $dependencies,
            $version,
            true
        );

        if ( function_exists( 'wp_set_script_translations' ) ) {
            wp_set_script_translations( 'saspay_wc_gateway-blocks-integration', 'saspay-for-woocommerce' );
        }

        return array( 'saspay_wc_gateway-blocks-integration' );
    }

    /**
     * Returns an array of key=>value pairs of data made available to the payment methods script.
     */
    public function get_payment_method_data(): array
    {
        return array(
            'title'       => $this->gateway->title,
            'description' => $this->gateway->description,
            'icon'        => plugins_url( 'assets/img/icon.svg', SASPAY_WC_MAIN_FILE ),
            'supports'    => array_filter( $this->gateway->supports ),
        );
    }
}
