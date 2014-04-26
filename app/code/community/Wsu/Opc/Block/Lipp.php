<?php
class IWD_Opc_Block_Lipp extends  Mage_Core_Block_Template{
	
	public function getJsonConfig() {
	
		$config = array ();
		
		$scheme = Mage::app()->getRequest()->getScheme();
		$secure = false;
		$config['baseUrl'] = Mage::getBaseUrl('link', $secure);
		$config['paypalexpress'] = Mage::helper('opc')->getPayPalExpressUrl();
		$config['paypalLightBoxEnabled'] = Mage::helper('opc')->getPayPalLightboxEnabled();
		return Mage::helper ( 'core' )->jsonEncode ( $config );
	}
	
	
	
	
}