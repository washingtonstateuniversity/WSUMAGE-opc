<?php
class Wsu_Opc_Model_Observer{
	
	public function applyComment($observer){
		$order = $observer->getData('order');
		$comment = Mage::getSingleton('core/session')->getOpcOrderComment();
		if (!Mage::helper('wsu_opc')->isShowComment() || empty($comment)){
			return;
		}
		try{
			$order->addStatusHistoryComment($comment)->setIsVisibleOnFront(true)->setIsCustomerNotified(true);
			$order->save();
			$order->sendOrderUpdateEmail(true, $comment);
		}catch(Exception $e){
			Mage::logException($e);
		}
	}	
	
}