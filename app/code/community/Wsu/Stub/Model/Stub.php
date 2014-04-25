<?php
class Wsu_Stub_Model_Launcher extends Mage_Core_Model_Abstract {
    const CONFIG_CACHE_ID = 'wsu_stub_config';
    protected $_config;
    protected $_indexers = array( );
    protected $_scopes = array( );
    protected function _construct( ) {
        $this->_initConfig();
        $this->_loadIndexers();
    }
	/* you may use a custom config file.  This would be
	the only extention file that would be remotally ok to 
	write to if there was cause*/
    protected function _initConfig( ) {
        $cacheId = self::CONFIG_CACHE_ID;
        $data    = Mage::app()->loadCache( $cacheId );
        if ( false !== $data ) {
            $data = unserialize( $data );
        } else {
            $xml  = Mage::getConfig()->loadModulesConfiguration( 'stub.xml' )->getNode();
            $data = $xml->asArray();
            Mage::app()->saveCache( serialize( $data ), $cacheId );
        }
        $this->_config = $data;
        return $this;
    }
    /* you can put usfull functions here */
}