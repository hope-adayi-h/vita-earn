<?php

namespace Saspay\WooCommerce;

use Exception;
use Saspay\WooCommerce\Handlers\Saspay_WC_Payment_Handler;

if (! defined('ABSPATH')) {
    exit;
}

class Saspay_WC_Gateway extends \WC_Payment_Gateway
{
    public array $saspay_wc_config = [];
    public ?string $saspay_api_key = null;
    const API_BASE_URL = 'https://api.saspay.me/api/v1';

    public function __construct()
    {
        $this->saspay_wc_load_handlers();
        $this->saspay_wc_initialize_gateway_details();
        $this->saspay_wc_initialize_settings();
        $this->saspay_wc_register_filters();
        $this->saspay_wc_check_if_webhook_secret_is_set_or_generate();
        
        $this->saspay_wc_register_hooks();
    }

    private function saspay_wc_initialize_gateway_details(): void
    {
        $this->id = 'saspay_wc_gateway';
        $this->icon = plugins_url( 'assets/img/icon.svg', SASPAY_WC_MAIN_FILE );
        $this->has_fields = false;
        $this->method_title = 'SasPay for WooCommerce';
        $logo_url = plugins_url( 'assets/img/logo.png', SASPAY_WC_MAIN_FILE );
        $this->method_description = '<p><img src="' . esc_url($logo_url) . '" alt="SasPay Logo" style="max-width: 150px; display: block; margin-bottom: 10px;" /></p>' .
                                    esc_html__('Acceptez les paiements par Mobile Money, carte bancaire et virement bancaire via une intégration unique à plusieurs passerelles de paiement.', 'saspay-for-woocommerce');
    }

    private function saspay_wc_register_filters(): void
    {
        add_filter("woocommerce_settings_api_sanitized_fields_{$this->id}", function ($settings) {
            if (isset($settings['webhook_url'])) {
                unset($settings['webhook_url']);
            }
            if (isset($settings['webhook_secret'])) {
                unset($settings['webhook_secret']);
            }
            return $settings;
        });
    }

    private function saspay_wc_initialize_settings(): void
    {
        $this->init_form_fields();
        $this->init_settings();
        foreach ($this->settings as $settingKey => $value) {
            $this->{$settingKey} = $value;
            $this->saspay_wc_config[$settingKey] = $value;
        }
        if (empty($this->title)) {
            $this->title = esc_html__('Mobile Money, Carte Bancaire, Virement et plus', 'saspay-for-woocommerce');
        }
        if (empty($this->description)) {
            $this->description = esc_html__('Payez en toute sécurité avec votre compte Mobile Money, carte bancaire, compte bancaire ou autres méthodes de paiement.', 'saspay-for-woocommerce');
        }
    }

    private function saspay_wc_register_hooks(): void
    {
        add_action('admin_notices', [$this, 'saspay_wc_do_ssl_check']);
        add_action('admin_notices', [$this, 'saspay_wc_require_keys']);

        // SasPay Return Handler
        add_action('woocommerce_api_saspay_wc_payment_return', [$this, 'saspay_wc_handle_return']);

        // SasPay Webhook Handler
        add_action('woocommerce_api_saspay_wc_webhook', [$this, 'saspay_wc_handle_webhook']);

        if (is_admin()) {
            add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
        }
    }

    public function init_form_fields(): void
    {
        $this->form_fields = include plugin_dir_path(__DIR__) . 'src/Settings/saspay-settings.php';
    }

    /**
     * Process the payment.
     *
     * @param int $order_id
     */
    public function process_payment($order_id): array
    {
        $order_id = absint($order_id);
        $order    = wc_get_order($order_id);

        if (! $this->saspay_wc_check_if_gateway_is_available()) {
            wc_add_notice(
                esc_html__('SasPay is not available at the moment. Please try again later. If you are the site owner, please check your settings.', 'saspay-for-woocommerce'),
                'error'
            );

            return [
                'result'   => 'fail',
                'redirect' => $order->get_checkout_payment_url(true),
            ];
        }

        $payload = [
            'amount'         => (string) $order->get_total(),
            'currency'       => get_woocommerce_currency(),
            'description'    => 'Order #' . $order->get_order_number(),
            'return_url'     => $this->get_payment_return_url($order_id),
            'customer_email' => $order->get_billing_email(),
            'customer_name'  => trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()),
            'customer_phone' => $order->get_billing_phone(),
            'metadata'       => [
                'order_id'    => (string) $order->get_id(),
                'customer_id' => (string) $order->get_customer_id(),
                'shop_name'   => get_bloginfo('name'),
                'shop_url'    => get_bloginfo('url'),
                'via'         => 'woocommerce_integration',
            ],
        ];
        
        $billing_country = $order->get_billing_country();
        if (!empty($billing_country) && strlen($billing_country) === 2) {
            $payload['country'] = $billing_country;
        }

        $body = wp_json_encode($payload);

        $args = [
            'body'        => $body,
            'timeout'     => 45,
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking'    => true,
            'headers'     => [
                'Authorization'   => 'Bearer ' . $this->saspay_api_key,
                'Content-Type'    => 'application/json',
                'Accept'          => 'application/json',
                'Idempotency-Key' => $this->saspay_wc_idempotency_key($order_id, (string) $body),
            ],
        ];

        $response = wp_remote_post(self::API_BASE_URL . '/checkout-sessions/', $args);

        if (is_wp_error($response)) {
            wc_add_notice(esc_html__('Erreur de connexion à la plateforme de paiement.', 'saspay-for-woocommerce'), 'error');
            wc_get_logger()->error('SasPay API Error: ' . $response->get_error_message(), ['source' => 'saspay-for-woocommerce']);

            return [
                'result'   => 'fail',
                'redirect' => $order->get_checkout_payment_url(true),
            ];
        }

        $response_code = (int) wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        $decoded       = json_decode($response_body, true);

        if (! is_array($decoded)) {
            $decoded = [];
        }

        // Enveloppe uniforme de l'API SasPay (StandardJSONRenderer, TOUTES les
        // réponses) : {"success": true, "data": {...}, "code": N} en succès,
        // {"success": false, "error": {...}, "code": N} en échec. Sans ce
        // déballage, data['checkout_url']/data['id'] sont toujours absents —
        // même un 201 Created (vrai succès) tombait dans la branche d'erreur.
        $data = $decoded['data'] ?? ($decoded['error'] ?? $decoded);
        if (! is_array($data)) {
            $data = [];
        }

        $checkout_url = isset($data['checkout_url'])
            ? esc_url_raw((string) $data['checkout_url'])
            : '';

        if ($response_code < 200 || $response_code >= 300 || empty($checkout_url) || ! wp_http_validate_url($checkout_url)) {
            $error_msg = 'Erreur inconnue (HTTP ' . $response_code . ')';
            if (isset($data['message']) && is_string($data['message'])) {
                // Erreur métier : {"message": "...", "code": "..."}.
                $error_msg = $data['message'];
            } elseif (! empty($data)) {
                // Erreur de validation : {"champ": ["message", ...], ...}.
                $parts = [];
                foreach ($data as $field => $messages) {
                    if (is_array($messages)) {
                        $parts[] = $field . ': ' . implode(', ', array_map('strval', $messages));
                    }
                }
                if ($parts) {
                    $error_msg = implode(' | ', $parts);
                }
            }

            wc_add_notice(
                esc_html__( 'Erreur lors de l\'initialisation du paiement: ', 'saspay-for-woocommerce' ) . esc_html( $error_msg ),
                'error'
            );
            wc_get_logger()->error(
                'SasPay API Error (HTTP ' . $response_code . '): ' . $response_body,
                ['source' => 'saspay-for-woocommerce']
            );

            return [
                'result'   => 'fail',
                'redirect' => $order->get_checkout_payment_url(true),
            ];
        }

        $session_id = $this->saspay_wc_sanitize_remote_id($data['id'] ?? '');

        if ($session_id === '') {
            wc_add_notice(esc_html__('Erreur lors de l\'initialisation du paiement: ', 'saspay-for-woocommerce') . esc_html__('session ID invalide.', 'saspay-for-woocommerce'), 'error');
            wc_get_logger()->error('SasPay API Error: invalid session ID in response', ['source' => 'saspay-for-woocommerce']);

            return [
                'result'   => 'fail',
                'redirect' => $order->get_checkout_payment_url(true),
            ];
        }

        $order->add_order_note(
            sprintf(
                /* translators: %s: SasPay checkout session ID */
                esc_html__( 'Payment initiated on SasPay. Session ID: %s', 'saspay-for-woocommerce' ),
                esc_html($session_id)
            )
        );

        $order->update_meta_data('_saspay_session_id', $session_id);
        $order->update_meta_data('_saspay_checkout_url', $checkout_url);
        $order->update_status('pending', esc_html__('Awaiting SasPay payment.', 'saspay-for-woocommerce'));
        $order->save();

        return [
            'result'   => 'success',
            'redirect' => $checkout_url,
        ];
    }

    /**
     * Get the payment return URL.
     */
    public function get_payment_return_url(string $order_id): string
    {
        $baseURL = esc_url(add_query_arg('wc-api', 'saspay_wc_payment_return', home_url('/')));
        $baseURL = add_query_arg('order_id', $order_id, $baseURL);

        return str_replace('http:', 'https:', $baseURL);
    }

    /**
     * Handle the payment return from SasPay.
     */
    public function saspay_wc_handle_return(): void
    {
        global $woocommerce;

        // External return from SasPay — no WordPress nonce is available on this callback.
        if ( ! isset( $_GET['order_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            wp_safe_redirect( wc_get_checkout_url() );
            exit;
        }

        $order_id = absint( wp_unslash( $_GET['order_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $order    = wc_get_order( $order_id );

        if ( ! $order ) {
            wp_safe_redirect( wc_get_checkout_url() );
            exit;
        }

        $session_id = $this->saspay_wc_sanitize_remote_id($order->get_meta('_saspay_session_id'));

        if ( empty( $session_id ) ) {
            wc_get_logger()->error( 'SasPay Return: No session ID found for order ' . $order_id, array( 'source' => 'saspay-for-woocommerce' ) );
            wc_add_notice( esc_html__( 'Session de paiement introuvable.', 'saspay-for-woocommerce' ), 'error' );
            wp_safe_redirect( wc_get_checkout_url() );
            exit;
        }

        $handler = new Saspay_WC_Payment_Handler(
            $session_id,
            $this->saspay_api_key,
            $woocommerce
        );
        $handler->set_is_session( true );

        $handler->handle_return( $order, $this->get_return_url( $order ) );
    }

    /**
     * Handle the webhook from SasPay.
     */
    public function saspay_wc_handle_webhook(): void
    {
        global $woocommerce;

        if (! $this->saspay_wc_check_if_gateway_is_available()) {
            wc_get_logger()->error('SasPay Webhook Error: Gateway is not available', ['source' => 'saspay-for-woocommerce']);
            return;
        }

        $payload = file_get_contents('php://input');

        if (! is_string($payload) || $payload === '') {
            status_header(400);
            return;
        }

        $signature = isset($_SERVER['HTTP_X_WEBHOOK_SIGNATURE']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_X_WEBHOOK_SIGNATURE'])) : '';
        $timestamp = isset($_SERVER['HTTP_X_WEBHOOK_TIMESTAMP']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_X_WEBHOOK_TIMESTAMP'])) : '';

        if (! $this->saspay_wc_webhook_signature_is_valid($payload, $signature, $timestamp)) {
            wc_get_logger()->warning('SasPay Webhook rejected: invalid signature or timestamp', ['source' => 'saspay-for-woocommerce']);
            status_header(401);
            return;
        }

        try {
            $webhook_data = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);

            $event = is_array($webhook_data) && isset($webhook_data['event']) ? (string) $webhook_data['event'] : '';
            $data  = is_array($webhook_data) && isset($webhook_data['data']) && is_array($webhook_data['data']) ? $webhook_data['data'] : [];

            if (strpos($event, 'transaction.') !== 0 || empty($data['id'])) {
                status_header(200);
                return;
            }

            $transaction_id = $this->saspay_wc_sanitize_remote_id($data['id']);

            if ($transaction_id === '') {
                status_header(400);
                return;
            }

            $handler = new Saspay_WC_Payment_Handler(
                $transaction_id,
                $this->saspay_api_key,
                $woocommerce
            );

            $handler->handle_webhook();
            status_header(200);
        } catch (Exception $e) {
            status_header(400);
            wc_get_logger()->error('SasPay Webhook Exception: ' . $e->getMessage(), ['source' => 'saspay-for-woocommerce']);
            return;
        }
    }

    /**
     * Check for SSL certificate.
     */
    public function saspay_wc_do_ssl_check(): void
    {
        if (! $this->saspay_wc_should_show_admin_notice()) {
            return;
        }

        $destination = WC_VERSION >= 3.4
            ? 'wc-settings&tab=advanced'
            : 'wc-settings&tab=checkout';

        if ( ( $this->enabled === 'yes' ) && get_option( 'woocommerce_force_ssl_checkout' ) == 'no' ) {
            echo '<div class="error"><p>';
            echo wp_kses_post(
                sprintf(
                    /* translators: 1: payment method title, 2: URL to WooCommerce SSL settings */
                    __( '<strong>%1$s</strong> is enabled and WooCommerce is not forcing SSL on checkout. Please secure your site and <a href="%2$s">force SSL on checkout.</a>', 'saspay-for-woocommerce' ),
                    esc_html( $this->method_title ),
                    esc_url( admin_url( 'admin.php?page=' . $destination ) )
                )
            );
            echo '</p></div>';
        }
    }

    /**
     * Check if API keys are set.
     */
    private function saspay_wc_keys_are_set(): bool
    {
        return ! empty($this->saspay_api_key);
    }

    /**
     * Load handlers.
     */
    private function saspay_wc_load_handlers(): void
    {
        require_once plugin_dir_path(__FILE__) . '/Handlers/Saspay_WC_Payment_Handler.php';
    }

    /**
     * Check plugin config.
     */
    public function saspay_wc_require_keys(): bool
    {
        if ($this->enabled === 'no') {
            return false;
        }
        if ( ! $this->saspay_wc_keys_are_set() ) {
            if ($this->saspay_wc_should_show_admin_notice()) {
                echo '<div class="error"><p>';
                echo wp_kses_post(
                    sprintf(
                        /* translators: 1: payment method title, 2: URL to gateway settings */
                        __( '<strong>%1$s</strong> is enabled, but API keys are missing. Please enter them <a href="%2$s">here</a>.', 'saspay-for-woocommerce' ),
                        esc_html( $this->method_title ),
                        esc_url( admin_url( 'admin.php?page=wc-settings&tab=checkout&section=saspay_wc_gateway' ) )
                    )
                );
                echo '</p></div>';
            }
            return false;
        }

        return true;
    }

    /**
     * Check if webhook secret is set or generate.
     */
    public function saspay_wc_check_if_webhook_secret_is_set_or_generate(): void
    {
        if (get_option('saspay_wc_webhook_secret') === false) {
            $webhook_secret = bin2hex(random_bytes(16));
            update_option('saspay_wc_webhook_secret', $webhook_secret);
        }
    }

    /**
     * Check if the gateway is available for use.
     */
    public function saspay_wc_check_if_gateway_is_available(): bool
    {
        if ($this->enabled === 'no') {
            return false;
        }

        return $this->saspay_wc_keys_are_set();
    }

    /**
     * Verify the HMAC signature of a SasPay webhook: sha256 over "timestamp.body",
     * with a 5 minute tolerance on the timestamp.
     */
    private function saspay_wc_webhook_signature_is_valid(string $payload, string $signature, string $timestamp): bool
    {
        $secret = (string) get_option('saspay_wc_webhook_secret', '');

        if ($secret === '' || $signature === '' || ! ctype_digit($timestamp)) {
            return false;
        }

        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

        return hash_equals($expected, strtolower($signature));
    }

    /**
     * Stable idempotency key per order and request body: a retry of the same
     * checkout reuses the same key, a changed body gets a new one.
     */
    private function saspay_wc_idempotency_key(int $order_id, string $body): string
    {
        $hash = hash('sha256', $order_id . '|' . $body);

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hash, 0, 8),
            substr($hash, 8, 4),
            substr($hash, 12, 4),
            substr($hash, 16, 4),
            substr($hash, 20, 12)
        );
    }

    public static function saspay_wc_get_webhook_url(): string
    {
        return esc_url(add_query_arg('wc-api', 'saspay_wc_webhook', home_url('/')));
    }

    /**
     * Limit admin notices to WooCommerce settings and the plugins screen.
     */
    private function saspay_wc_should_show_admin_notice(): bool
    {
        if (! current_user_can('manage_woocommerce')) {
            return false;
        }

        $screen    = function_exists('get_current_screen') ? get_current_screen() : null;
        $screen_id = ($screen && isset($screen->id)) ? $screen->id : '';
        $page      = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

        return in_array($screen_id, ['woocommerce_page_wc-settings', 'plugins'], true)
            || $page === 'wc-settings';
    }

    /**
     * Sanitize a SasPay session or transaction ID before using it.
     *
     * @param mixed $id Remote identifier.
     */
    private function saspay_wc_sanitize_remote_id($id): string
    {
        $id = sanitize_text_field(wp_unslash((string) $id));

        if ($id === '' || strlen($id) > 128) {
            return '';
        }

        if (strpos($id, '/') !== false || strpos($id, '\\') !== false || strpos($id, '..') !== false) {
            return '';
        }

        return $id;
    }
}
