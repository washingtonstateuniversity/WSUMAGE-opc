<?php
class Wsu_Opc_Block_Paypal_login extends Mage_Core_Block_Template {
	protected function _toHtml(){
		$isExtensionEnabled = Mage::getStoreConfigFlag('wsu_opc/paypallogin/status');
		if ($isExtensionEnabled) {
			return parent::_toHtml();
		}
		return '';
	}

	public function getPayPalButtonUrl(){
		return Mage::helper('wsu_opc/paypal')->getPayPalButtonUrl();
	}

}
