<?php

class Wsu_Opc_Model_System_Config_Source_Form
{
    public function toOptionArray()//$isActiveOnlyFlag = false)
    {
         return array(
            array('value' => 'billing_above', 'label'=>Mage::helper('adminhtml')->__('Billing (above)')),
            array('value' => 'billing_below', 'label'=>Mage::helper('adminhtml')->__('Billing (below)')),
            array('value' => 'review_above', 'label'=>Mage::helper('adminhtml')->__('Review (above)')),
            array('value' => 'review_below', 'label'=>Mage::helper('adminhtml')->__('Review (below)')),
         );

    }
}
