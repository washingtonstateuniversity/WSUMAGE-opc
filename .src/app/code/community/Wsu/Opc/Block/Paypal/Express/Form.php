<?php
/**
 * PayPal Standard payment "form"
 */
class Wsu_Opc_Block_Paypal_Express_Form extends Wsu_Opc_Block_Paypal_Standard_Form
{
    /**
     * Payment method code
     * @var string
     * @access protected
     */
    protected $_methodCode = Mage_Paypal_Model_Config::METHOD_WPP_EXPRESS;

    /**
     * Set template and redirect message
     *
     * @return Mage_Core_Block_Abstract
     * @access protected
     */
    protected function _construct()
    {
        $result = parent::_construct();
        $this->setRedirectMessage(Mage::helper('paypal')->__('You will be redirected to the PayPal website.'));
        return $result;
    }

    /**
     * Set data to block
     *
     * @return Mage_Core_Block_Abstract
     * @access protected
     */
    protected function _beforeToHtml()
    {
        $customerId = Mage::getSingleton('customer/session')->getCustomerId();
        if (Mage::helper('paypal')->shouldAskToCreateBillingAgreement($this->_config, $customerId) && $this->canCreateBillingAgreement()) {
            $this->setCreateBACode(Mage_Paypal_Model_Express_Checkout::PAYMENT_INFO_TRANSPORT_BILLING_AGREEMENT);
        }
        return parent::_beforeToHtml();
    }
}
