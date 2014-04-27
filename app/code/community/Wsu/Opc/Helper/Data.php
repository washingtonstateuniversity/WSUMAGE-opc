<?php
class Wsu_Opc_Helper_Data extends Mage_Core_Helper_Abstract {

	private $_version = 'CE';

	const VAT_FRONTEND_VISIBILITY = 'customer/create_account/vat_frontend_visibility';
	const SHIPPING_VISIBILITY = 'wsu_opc/default/show_shipping';
	const TERMS_TYPE = 'wsu_opc/default/terms_type';
	const COMMENT = 'wsu_opc/default/comment';
	const PAYPAL_LIGHTBOX_SANDBOX = 'wsu_opc/paypal/sandbox';
	const PAYPAL_LIGHTBOX_ENABLED = 'wsu_opc/paypal/status';

	public function isAvailableVersion(){
		$mage  = new Mage();
		if (!is_callable(array($mage, 'getEdition'))){
			$edition = 'Community';
		}else{
			$edition = Mage::getEdition();
		}
		unset($mage);
		if ($edition=='Enterprise' && $this->_version=='CE'){
			return false;
		}
		return true;
	}

	public function isEnable(){
		$status = Mage::getStoreConfig('wsu_opc/global/status');		
		return $status;
	}

	public function hasCheckoutForm(){
		
		return false;	
	}



	/**
	 * Get string with frontend validation classes for attribute
	 *
	 * @param string $attributeCode
	 * @return string
	 */
	public function getAttributeValidationClass($attributeCode){
		/** @var $attribute Mage_Customer_Model_Attribute */
		if( isset($this->_attributes[$attributeCode]) ){
			$attribute = $this->_attributes[$attributeCode];
		}else{
			$attribute = Mage::getSingleton('eav/config')->getAttribute('customer_address', $attributeCode);
		}

		$class = $attribute ? $attribute->getFrontend()->getClass() : '';

		if (in_array($attributeCode, array('firstname', 'middlename', 'lastname', 'prefix', 'suffix', 'taxvat'))) {
			if ($class && !$attribute->getIsVisible()) {
				$class = ''; // address attribute is not visible thus its validation rules are not applied
			}

			$customerAttribute = Mage::getSingleton('eav/config')->getAttribute('customer', $attributeCode);
			
			$class .= '';
			if( $customerAttribute && $customerAttribute->getIsVisible() ){
				$class .= $customerAttribute->getFrontend()->getClass();
			}
			$class = implode(' ', array_unique(array_filter(explode(' ', $class))));
		}
		return $class;
	}
	
	public function isVatAttributeVisible(){
		return (bool)Mage::getStoreConfig(self::VAT_FRONTEND_VISIBILITY);
	}

	/* thinking ahead here */
	public function isEnterprise(){
		return Mage::getConfig()->getModuleConfig('Enterprise_Enterprise') 
				&& Mage::getConfig()->getModuleConfig('Enterprise_AdminGws') 
				&& Mage::getConfig()->getModuleConfig('Enterprise_Checkout') 
				&& Mage::getConfig()->getModuleConfig('Enterprise_Customer');
	}

	public function isShowShippingForm(){
		return (bool) Mage::getStoreConfig(self::SHIPPING_VISIBILITY);
	}

	public function getTermsType(){
		return Mage::getStoreConfig(self::TERMS_TYPE);
	}

	public function isShowComment(){
		return Mage::getStoreConfig(self::COMMENT);
	}

	public function getPayPalExpressUrl(){
		return 'https://www.'.(Mage::getStoreConfig(self::PAYPAL_LIGHTBOX_SANDBOX)?'sandbox.':'').'paypal.com/checkoutnow?token=';
	}
	
	public function getPayPalLightboxEnabled(){
		return (bool)Mage::getStoreConfig(self::PAYPAL_LIGHTBOX_ENABLED);
	}
}