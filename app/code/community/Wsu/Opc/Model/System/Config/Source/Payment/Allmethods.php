<?php
class Wsu_Opc_Model_System_Config_Source_Payment_Allmethods extends Mage_Payment_Helper_Data  {
    public function toOptionArray() {
        //$methods = Mage::helper('payment')->getPaymentMethodList(true, false, true, Mage::app()->getStore());
		$sorted=true;
		$asLabelValue=true;
		$withGroups=true;
		
		
		$store=Mage::app()->getStore();
		$methodsobj=$this->getPaymentMethods($store);
		//var_dump($methodsobj);
        $methods = array();
        $groups = array();
        $groupRelations = array();

        foreach ($methodsobj as $code => $data) {
			if (isset($data['active']) && $data['active']>0) {
				if ((isset($data['title']))) {
					$methods[$code] = $data['title'];
				} else {
					if ($this->getMethodInstance($code)) {
						$methods[$code] = $this->getMethodInstance($code)->getConfigData('title', $store);
					}
				}
				if ($asLabelValue && $withGroups && isset($data['group'])) {
					$groupRelations[$code] = $data['group'];
				}
			}
        }
        if ($asLabelValue && $withGroups) {
            $groups = Mage::app()->getConfig()->getNode(self::XML_PATH_PAYMENT_GROUPS)->asCanonicalArray();
            foreach ($groups as $code => $title) {
                $methods[$code] = $title; // for sorting, see below
            }
        }
        if ($sorted) {
            asort($methods);
        }
        if ($asLabelValue) {
            $labelValues = array();
            foreach ($methods as $code => $title) {
                $labelValues[$code] = array();
            }
            foreach ($methods as $code => $title) {
                if (isset($groups[$code])) {
                    $labelValues[$code]['label'] = $title;
                } elseif (isset($groupRelations[$code])) {
                    unset($labelValues[$code]);
                    $labelValues[$groupRelations[$code]]['value'][$code] = array('value' => $code, 'label' => $title);
                } else {
                    $labelValues[$code] = array('value' => $code, 'label' => $title);
                }
            }
			//var_dump($labelValues);die();
            return $labelValues;
        }


    }
}
