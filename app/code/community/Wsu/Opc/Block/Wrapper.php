<?php
class Wsu_Opc_Block_Wrapper extends  Mage_Core_Block_Template {
	const DEFAULT_SHIPPING = 'wsu_opc/default/shipping';
	const GEO_COUNTRY = 'wsu_opc/geo/country';
	const GEO_CITY = 'wsu_opc/geo/city';

	/**
	 * Get one page checkout model
	 * @return Mage_Checkout_Model_Type_Onepage
	 */
	public function getOnepage() {
		return Mage::getSingleton('checkout/type_onepage');
	}

	protected function _getReviewHtml() {
		//clear cache after change collection - if no magento can't find product in review block
		Mage::app()->getCacheInstance()->cleanType('layout');

		$layout = $this->getLayout();
		$update = $layout->getUpdate();
		$update->load('checkout_onepage_review');
		$layout->generateXml();
		$layout->generateBlocks();
		$review = $layout->getBlock('root');
		$review->setTemplate('wsu/opc/onepage/review/info.phtml');

		return $review->toHtml();
	}

	protected function _getCart() {
		return Mage::getSingleton('checkout/cart');
	}

	public function getJsonConfig() {
		$config = array ();
		$params = array (
			'_secure' => true
		);	
		$config['baseUrl'] = Mage::getBaseUrl('link', true);
		$config['isLoggedIn'] = (int) Mage::getSingleton('customer/session')->isLoggedIn();

		$config['geoCountry'] =  Mage::getStoreConfig(self::GEO_COUNTRY) ? Mage::helper('wsu_opc/country')->get() : false;
		$config['geoCity'] =  Mage::getStoreConfig(self::GEO_CITY) ? Mage::helper('wsu_opc/city')->get() : false;
		$config['comment'] = Mage::helper('wsu_opc')->isShowComment();
		$config['paypalexpress'] = Mage::helper('wsu_opc')->getPayPalExpressUrl();
		$config['paypalLightBoxEnabled'] = Mage::helper('wsu_opc')->getPayPalLightboxEnabled();

		return Mage::helper('core')->jsonEncode($config);
	}
}