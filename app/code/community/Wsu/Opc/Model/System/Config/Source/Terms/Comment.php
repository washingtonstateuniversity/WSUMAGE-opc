<?php
class Wsu_Opc_Model_System_Config_Source_Terms_Comment{
    public function getCommentText(){
		$agreeable = Mage::getStoreConfigFlag('checkout/options/enable_agreements');
        return $agreeable?false:"<b>Terms and Conditions is truned off.</b>  Untill you trun on 'agreements' this will affect nothing.  To change this set to yes under checkout settings.  <a href='".Mage::helper("adminhtml")->getUrl("adminhtml/system_config/edit/section/checkout")."' >Click here to change</a>";
    }
}
