<?php

defined( 'ABSPATH' ) || exit;

use Saspay\WooCommerce\Saspay_WC_Gateway;

return array(
    'enabled' => array(
        'title'       => esc_html__( 'Enable/Disable', 'saspay-for-woocommerce' ),
        'label'       => esc_html__( 'Enable SasPay', 'saspay-for-woocommerce' ),
        'type'        => 'checkbox',
        'description' => '',
        'default'     => 'yes',
        'desc_tip'    => true,
    ),
    'title' => array(
        'title'       => esc_html__( 'Title (Optional)', 'saspay-for-woocommerce' ),
        'type'        => 'text',
        'description' => esc_html__( 'This controls the title the user sees during checkout.', 'saspay-for-woocommerce' ),
        'default'     => esc_html__( 'Mobile Money & Card', 'saspay-for-woocommerce' ),
        'desc_tip'    => true,
    ),
    'description' => array(
        'title'       => esc_html__( 'Description (Optional)', 'saspay-for-woocommerce' ),
        'type'        => 'textarea',
        'maxlength'   => '150',
        'description' => esc_html__( 'This controls the description the user sees during checkout.', 'saspay-for-woocommerce' ),
        'default'     => esc_html__( 'Pay securely with Mobile Money or your bank card.', 'saspay-for-woocommerce' ),
        'desc_tip'    => true,
    ),
    'saspay_api_key' => array(
        'title'       => esc_html__( 'API Secret Key', 'saspay-for-woocommerce' ),
        'type'        => 'password',
        'description' => esc_html__( 'Get your API keys from your SasPay dashboard (sk_live_... or sk_test_...).', 'saspay-for-woocommerce' ),
    ),
    'webhook_url' => array(
        'title'             => esc_html__( 'Webhook URL', 'saspay-for-woocommerce' ),
        'type'              => 'text',
        'desc_tip'          => true,
        'default'           => Saspay_WC_Gateway::saspay_wc_get_webhook_url(),
        'description'       => esc_html__( 'Add this Webhook URL in your SasPay dashboard to receive payment notifications.', 'saspay-for-woocommerce' ),
        'custom_attributes' => array(
            'readonly' => 'readonly',
        ),
    ),
    'webhook_secret' => array(
        'title'             => esc_html__( 'Webhook Secret', 'saspay-for-woocommerce' ),
        'type'              => 'text',
        'desc_tip'          => true,
        'default'           => get_option( 'saspay_wc_webhook_secret' ),
        'description'       => esc_html__( 'Use this Webhook Secret in your SasPay dashboard when configuring webhooks.', 'saspay-for-woocommerce' ),
        'custom_attributes' => array(
            'readonly' => 'readonly',
        ),
    ),
);
