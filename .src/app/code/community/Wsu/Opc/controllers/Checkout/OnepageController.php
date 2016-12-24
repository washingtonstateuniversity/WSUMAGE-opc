<?php // @codingStandardsIgnoreFile
$wsu_av_class = false;

if (! Mage::helper('wsu_opc')->isEnable()) {
    // check if Wsu AddressValidation exists
    $path = Mage::getBaseDir('app') . DS . 'code' . DS . 'local' . DS;
    $file = 'Wsu/AddressVerification/controllers/OnepageController.php';
    // load Wsu OPC class
    if (file_exists($path . $file)) {
        // check if Wsu AV enabled
        if (Mage::helper('addressverification')->isAddressVerificationEnabled()) {
            $wsu_av_class = true;
        }
    }
}

if (! $wsu_av_class) {
    require_once Mage::getModuleDir('controllers', 'Mage_Checkout') . DS . 'OnepageController.php';
    class Wsu_Opc_Checkout_OnepageController extends Mage_Checkout_OnepageController
    {

        /**
         * Checkout page
         */
        public function indexAction()
        {
            $scheme = Mage::app()->getRequest()->getScheme();
            if ($scheme == 'http') {
                $secure = false;
            } else {
                $secure = true;
            }

            if (Mage::helper('wsu_opc')->isEnable()) {
                $this->_redirect('onepage', array (
                        '_secure' => $secure
                ));
                return;
            } else {
                parent::indexAction();
            }
        }
    }
} else {
    require_once Mage::getModuleDir('controllers', 'Wsu_AddressVerification') . DS . 'OnepageController.php';
    class Wsu_Opc_Checkout_OnepageController extends Wsu_AddressVerification_OnepageController
    {
    }
}
