<?php
class Wsu_Opc_Model_Resource_Paypal_Customer_Collection extends Mage_Core_Model_Resource_Db_Collection_Abstract
{
    /**
     * Resource initialization.
     *
     * @return void
     * @access protected
     */
    protected function _construct()
    {
        $this->_init('wsu_opc/paypal_customer');
    }
}
