<?php
class Wsu_Opc_Model_Resource_Tax_Calculation extends Mage_Tax_Model_Resource_Calculation
{
    protected function _getRates($request)
    {
  // this should be optional, and should account for Country as well
        //also, why not just fix the wild card ( long run thinking )
        $postcode = substr($request->getPostcode(), 0, 5);
        $request->setPostcode($postcode);
        return parent::_getRates($request);
    }
}
