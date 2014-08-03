<?php

class Wsu_Opc_Model_System_Config_Source_Notice_Block_Update{
    public function toOptionArray($isActiveOnlyFlag=false) {
         return array(
            array('value' => 'full', 'label'=>Mage::helper('adminhtml')->__('Full')),
			array('value' => 'lite', 'label'=>Mage::helper('adminhtml')->__('Lite'))
        );
    }
}
