<?php
class Wsu_Opc_VersionController extends Mage_Core_Controller_Front_Action
{

    public function indexAction()
    {
        $version = Mage::getConfig()->getModuleConfig("Wsu_Opc")->version;
        // @codingStandardsIgnoreLine
        echo 'Wsu OPC Version: ' . $version;
        //return;
    }
}
