<?php
class Wsu_Opc_IndexController extends Mage_Checkout_Controller_Action{

	const TITLE = 'opc/global/title';
	const DEFAULT_PAYMENT = 'opc/default/payment';

	/**
	 * Get one page checkout model
	 *
	 * @return Mage_Checkout_Model_Type_Onepage
	 */
	public function getOnepage(){
		return Mage::getSingleton('checkout/type_onepage');
	}

	protected function _getCart(){
		return Mage::getSingleton('checkout/cart');
	}

	/**
	 * Predispatch: should set layout area
	 *
	 * @return Mage_Checkout_OnepageController
	 */
	public function preDispatch() {
		parent::preDispatch();
		$this->_preDispatchValidateCustomer();
	
		$checkoutSessionQuote = Mage::getSingleton('checkout/session')->getQuote();
		if ($checkoutSessionQuote->getIsMultiShipping()) {
			$checkoutSessionQuote->setIsMultiShipping(false);
			$checkoutSessionQuote->removeAllAddresses();
		}
	
		if (!$this->_canShowForUnregisteredUsers()) {
			$this->norouteAction();
			$this->setFlag('',self::FLAG_NO_DISPATCH,true);
			return;
		}
	
		return $this;
	}

	protected function updateDefaultPayment(){
		$defaultPaymentMethod = Mage::getStoreConfig(self::DEFAULT_PAYMENT);
		$_cart = $this->_getCart();
		$_quote = $_cart->getQuote();
		$_quote->getPayment()->setMethod($defaultPaymentMethod);
		$_quote->setTotalsCollectedFlag(false)->collectTotals();
		$_quote->save();
	}

	/**
	 * Checkout page
	 */
	public function indexAction(){
		if (!Mage::helper('checkout')->canOnepageCheckout()) {
			Mage::getSingleton('checkout/session')->addError($this->__('The onepage checkout is disabled.'));
			$this->_redirect('checkout/cart');
			return;
		}
		$quote = $this->getOnepage()->getQuote();
		if (!$quote->hasItems() || $quote->getHasError()) {
			$this->_redirect('checkout/cart');
			return;
		}

		Mage::app()->getCacheInstance()->cleanType('layout');

		$this->updateDefaultPayment();

		if (!$quote->validateMinimumAmount()) {
			$error = Mage::getStoreConfig('sales/minimum_order/error_message') ?
				Mage::getStoreConfig('sales/minimum_order/error_message') :
				Mage::helper('checkout')->__('Subtotal must exceed minimum order amount');

			Mage::getSingleton('checkout/session')->addError($error);
			$this->_redirect('checkout/cart');
			return;
		}
		Mage::getSingleton('checkout/session')->setCartWasUpdated(false);
		Mage::getSingleton('customer/session')->setBeforeAuthUrl(Mage::getUrl('*/*/*', array('_secure' => true)));
		$this->getOnepage()->initCheckout();
		$this->loadLayout();
		$this->_initLayoutMessages('customer/session');
		$this->getLayout()->getBlock('head')->setTitle($this->__(Mage::getStoreConfig(self::TITLE)));
		$this->renderLayout();
	}
	
	/**
	 * Check can page show for unregistered users
	 *
	 * @return boolean
	 */
	protected function _canShowForUnregisteredUsers() {
		return Mage::getSingleton('customer/session')->isLoggedIn()
				|| $this->getRequest()->getActionName() == 'index'
				|| Mage::helper('checkout')->isAllowedGuestCheckout($this->getOnepage()->getQuote())
				|| !Mage::helper('checkout')->isCustomerMustBeLogged();
	}
}