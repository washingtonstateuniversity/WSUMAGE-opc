<?php
class Wsu_Opc_Block_Onepage_Subscribed extends Mage_Core_Block_Template{

	const NEWSLETTER = 'wsu_opc/default/subscribe';
	const NEWSLETTER_DEFAULT = 'wsu_opc/default/subscribe_default';

	public function getCheckByDefault() {
		return (bool) Mage::getStoreConfig(self::NEWSLETTER_DEFAULT);
	}

	public function isNewsletterEnabled() {
		$enable = Mage::helper('core')->isModuleOutputEnabled('Mage_Newsletter');
		$show = (bool) Mage::getStoreConfig(self::NEWSLETTER);
		if ($enable && $show && !Mage::getSingleton('customer/session')->isLoggedIn()){
			return true;
		}
		return false;
	}
}