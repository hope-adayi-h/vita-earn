<?php

namespace Saspay\WooCommerce\Handlers;

use Exception;
use Saspay\WooCommerce\Saspay_WC_Gateway;

if (! defined('ABSPATH')) {
    exit;
}

class Saspay_WC_Payment_Handler
{
    private object $woocommerce;
    private string $api_key;
    private string $transaction_id;
    private string $return_url;
    private bool $is_session = false;
    private bool $is_webhook = false;

    public function __construct(string $transaction_id, string $api_key, object $woocommerce)
    {
        $this->transaction_id = sanitize_text_field($transaction_id);
        $this->api_key        = $api_key;
        $this->woocommerce    = $woocommerce;
    }

    public function set_is_session(bool $is_session): void
    {
        $this->is_session = $is_session;
    }

    private function fetch_transaction_details()
    {
        $args = [
            'timeout'     => 45,
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking'    => true,
            'headers'     => [
                'Authorization' => 'Bearer ' . $this->api_key,
                'Accept'        => 'application/json',
            ],
        ];

        $endpoint = $this->is_session ? '/checkout-sessions/' : '/transactions/';
        $response = wp_remote_get(
            Saspay_WC_Gateway::API_BASE_URL . $endpoint . rawurlencode($this->transaction_id) . '/',
            $args
        );

        if (is_wp_error($response)) {
            throw new Exception( esc_html( $response->get_error_message() ) );
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        if ($response_code < 200 || $response_code >= 300) {
            throw new Exception(
                esc_html(
                    sprintf(
                        /* translators: 1: HTTP response code, 2: response body */
                        __( 'API error %1$s: %2$s', 'saspay-for-woocommerce' ),
                        (string) $response_code,
                        $response_body
                    )
                )
            );
        }

        $decoded = json_decode($response_body, true);

        if (! is_array($decoded)) {
            throw new Exception(esc_html__('Invalid API response.', 'saspay-for-woocommerce'));
        }

        return $decoded;
    }

    public function handle_return(object $order, string $return_url): void
    {
        $this->return_url = esc_url_raw($return_url);

        try {
            $session = $this->fetch_transaction_details();
            $tx_data = $session['data'] ?? $session;

            if (! is_array($tx_data)) {
                $this->redirect_to_checkout_url('Invalid payment response.');
                return;
            }

            // Order ID can be in metadata
            $payment_order_id = isset($tx_data['metadata']['order_id'])
                ? absint($tx_data['metadata']['order_id'])
                : null;

            if (! $payment_order_id || $order->get_id() !== $payment_order_id) {
                wc_get_logger()->info('SasPay Payment Exception: Order ID mismatch or not found', ['source' => 'saspay-for-woocommerce']);
                $this->redirect_to_checkout_url('Order ID mismatch. Expected: ' . $order->get_id() . ', got: ' . $payment_order_id);
                return;
            }

            $this->process_payment_response($tx_data, $order);
        } catch (Exception $e) {
            wc_get_logger()->error('SasPay Payment Exception: ' . wp_kses_post($e->getMessage()), ['source' => 'saspay-for-woocommerce']);
            $this->redirect_to_checkout_url('Fetch error: ' . $e->getMessage());
        }
    }

    public function handle_webhook(): void
    {
        $this->is_webhook = true;

        try {
            $response = $this->fetch_transaction_details();
            $tx_data  = $response['data'] ?? $response;

            if (! is_array($tx_data)) {
                return;
            }
            
            $payment_order_id = isset($tx_data['metadata']['order_id']) ? absint($tx_data['metadata']['order_id']) : null;

            $order = wc_get_order($payment_order_id);
            if (! $order) {
                return;
            }
            $this->process_payment_response($tx_data, $order);
        } catch (Exception $e) {
            wc_get_logger()->error('SasPay Webhook Exception: ' . wp_kses_post($e->getMessage()), ['source' => 'saspay-for-woocommerce']);
            return;
        }
    }

    private function process_payment_response(array $transaction, object $order): void
    {
        $status      = strtoupper(sanitize_text_field((string) ($transaction['status'] ?? 'FAILED')));
        $amount_paid = isset($transaction['amount']) ? (float) $transaction['amount'] : 0.0;

        if (isset($transaction['id'])) {
            $transaction['id'] = sanitize_text_field((string) $transaction['id']);
        }

        wc_get_logger()->info(
            'SasPay: processing status "' . $status . '" for order #' . $order->get_id(),
            ['source' => 'saspay-for-woocommerce']
        );

        // SasPay redirects to return_url only on PAID or FAILED — never on PENDING
        if (in_array($status, ['SUCCESS', 'SUCCESSFUL', 'PAID', 'COMPLETED'], true)) {
            if ($amount_paid > 0 && $amount_paid < (float) $order->get_total()) {
                $this->handle_insufficient_payment($transaction, $order);
            } else {
                $this->handle_payment_success($transaction, $order);
            }
        } elseif (in_array($status, ['EXPIRED', 'CANCELLED', 'CANCELED', 'FAILED', 'FAILURE'], true)) {
            $this->handle_payment_failed($order, $transaction);
        } elseif ($status === 'PENDING') {
            // PENDING on return = async payment still in progress (edge case)
            // On webhook this is normal; on return, put on-hold for manual review
            wc_get_logger()->info(
                'SasPay: PENDING status received on return for order #' . $order->get_id() . '. Putting on-hold.',
                ['source' => 'saspay-for-woocommerce']
            );
            $this->handle_payment_pending($transaction, $order);
        } else {
            // Unknown status: put on hold for manual review
            wc_get_logger()->warning(
                'SasPay: Unknown status "' . $status . '" for order #' . $order->get_id(),
                ['source' => 'saspay-for-woocommerce']
            );
            $this->handle_payment_pending($transaction, $order);
        }
    }

    private function handle_payment_success(array $transaction, object $order): void
    {
        if ($order->get_status() === 'completed' || $order->get_status() === 'processing') {
            $this->redirect_to_return_url();
            return;
        }

        $order->update_status('completed');
        
        if (! empty($this->woocommerce->cart)) {
            $this->woocommerce->cart->empty_cart();
        }
        wc_reduce_stock_levels($order->get_id());

        $order->add_order_note( esc_html__( 'Payment was successful on SasPay.', 'saspay-for-woocommerce' ) );
        $order->add_order_note(
            sprintf(
                /* translators: %s: SasPay transaction ID */
                esc_html__( 'SasPay Transaction ID: %s', 'saspay-for-woocommerce' ),
                esc_html( (string) $transaction['id'] )
            )
        );

        $customer_note  = esc_html__( 'Thank you for your order.', 'saspay-for-woocommerce' );
        $customer_note .= ' ';
        $customer_note .= esc_html__( 'Your payment was successful and your order is now complete.', 'saspay-for-woocommerce' );

        $order->add_order_note($customer_note, 1);

        if (!$this->is_webhook) {
            wc_add_notice($customer_note, 'notice');
        }

        $this->redirect_to_return_url();
    }

    private function handle_payment_pending(array $transaction, object $order): void
    {
        if (in_array($order->get_status(), ['on-hold', 'processing', 'completed'], true)) {
            $this->redirect_to_return_url();
            return;
        }

        $order->update_status('on-hold');

        $admin_notice = esc_html__( 'Payment is pending confirmation on SasPay.', 'saspay-for-woocommerce' );
        if ( ! empty( $transaction['id'] ) ) {
            $admin_notice .= ' ' . sprintf(
                /* translators: %s: SasPay session/transaction ID */
                esc_html__( 'SasPay Session ID: %s', 'saspay-for-woocommerce' ),
                esc_html( (string) $transaction['id'] )
            );
        }
        $order->add_order_note( $admin_notice );

        $customer_notice = esc_html__( 'Your payment is being processed. Your order will be updated once confirmed.', 'saspay-for-woocommerce' );
        $order->add_order_note($customer_notice, 1);
        $order->save();

        if (!$this->is_webhook) {
            wc_add_notice($customer_notice, 'notice');
        }

        $this->redirect_to_return_url();
    }

    private function handle_insufficient_payment(array $transaction, object $order): void
    {
        if ($order->get_status() === 'on-hold') {
            $this->redirect_to_return_url();
            return;
        }

        $order->update_status('on-hold');

        $admin_notice = sprintf(
            /* translators: 1: transaction ID, 2: amount paid, 3: order total, 4: currency */
            esc_html__( 'Attention: Order placed on hold because of incorrect payment amount. Transaction ID: %1$s. Amount paid: %2$s. Order amount: %3$s %4$s', 'saspay-for-woocommerce' ),
            esc_html( (string) $transaction['id'] ),
            esc_html( (string) $transaction['amount'] ),
            esc_html( (string) $order->get_total() ),
            esc_html( (string) $order->get_currency() )
        );

        $order->add_order_note($admin_notice);

        $this->redirect_to_return_url();
    }

    private function handle_payment_failed(object $order, array $transaction): void
    {
        if ($order->get_status() === 'failed' || $order->get_status() === 'cancelled') {
            $this->redirect_to_checkout_url('Order already marked as failed/cancelled.');
            return;
        }

        $order->update_status('failed');

        $admin_notice = sprintf(
            /* translators: %s: SasPay transaction ID */
            esc_html__( 'Payment failed on SasPay. Transaction ID: %s', 'saspay-for-woocommerce' ),
            esc_html( (string) $transaction['id'] )
        );
        $order->add_order_note( $admin_notice );

        if (!$this->is_webhook) {
            wc_add_notice(esc_html__('Your payment failed. Please try again.', 'saspay-for-woocommerce'), 'error');
        }

        $this->redirect_to_checkout_url();
    }

    private function redirect_to_return_url(): void
    {
        if ($this->is_webhook) {
            return;
        }

        wp_safe_redirect($this->return_url);
        exit();
    }

    private function redirect_to_checkout_url(?string $error_message = null): void
    {
        if ($this->is_webhook) {
            return;
        }

        $notice = esc_html__('An error occurred while processing your payment. Please try again.', 'saspay-for-woocommerce');
        if ($error_message) {
            $notice .= ' (' . esc_html($error_message) . ')';
        }
        
        wc_add_notice($notice, 'error');

        wp_safe_redirect(wc_get_checkout_url());
        exit();
    }
}
