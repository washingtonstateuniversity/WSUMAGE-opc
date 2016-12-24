<?php
class Wsu_Opc_Block_Wrapper extends Mage_Core_Block_Template
{
    const XML_PATH_DEFAULT_SHIPPING = 'wsu_opc/default/shipping';
    const XML_PATH_GEO_COUNTRY = 'wsu_opc/geo/country';
    const XML_PATH_GEO_CITY = 'wsu_opc/geo/city';

    /**
     * Get one page checkout model
     *
     * @return Mage_Checkout_Model_Type_Onepage
     */
    public function getOnepage()
    {
        return Mage::getSingleton('checkout/type_onepage');
    }

    protected function _getReviewHtml()
    {
        //clear cache after change collection - if not magento can't find product in review block
        Mage::app()->getCacheInstance()->cleanType('layout');

        $layout = $this->getLayout();
        $update = $layout->getUpdate();
        $update->load('checkout_onepage_review');
        $layout->generateXml();
        $layout->generateBlocks();
        $review = $layout->getBlock('root');
        $review->setTemplate('wsu/opc/onepage/review/info.phtml');

        return $review->toHtml();
    }

    protected function _getCart()
    {
        return Mage::getSingleton('checkout/cart');
    }


    public function getJsonConfig()
    {

        $config = array ();
        $params = array (
            '_secure' => true
        );

        $base_url = Mage::getBaseUrl('link', true);

        // protocol for ajax urls should be the same as for current page
        $http_protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']==='on')?'https':'http';
        if ($http_protocol == 'https') {
            $base_url = str_replace('http:', 'https:', $base_url);
        } else {
            $base_url = str_replace('https:', 'http:', $base_url);
        }


        $config['baseUrl'] = $base_url;
        $config['isLoggedIn'] = (int) Mage::getSingleton('customer/session')->isLoggedIn();
        $config['comment'] = Mage::helper('wsu_opc')->isShowComment();

        return Mage::helper('core')->jsonEncode($config);
    }

    protected function validateColor($color)
    {
        $correct_color = '';

        $pattern = "/([^0-9abcdef])/";
        if (!empty($color)) {
            $color = str_replace('#', '', $color);
            if (!preg_match($pattern, $color)) {
                if (strlen($color) == 3 || strlen($color) == 6) {
                    $correct_color = '#'.$color;
                }
            }
        }
        return $correct_color;
    }

    public function getDesignStyles()
    {
        $color1 = Mage::getStoreConfig('wsu_opc/design/plbgcolor');
        $color2 = Mage::getStoreConfig('wsu_opc/design/plovercolor');
        $color3 = Mage::getStoreConfig('wsu_opc/design/pltextcolor');
        $color4 = Mage::getStoreConfig('wsu_opc/design/btnbgcolor');
        $color5 = Mage::getStoreConfig('wsu_opc/design/btnovercolor');
        $color6 = Mage::getStoreConfig('wsu_opc/design/btntextcolor');

        $color7 = Mage::getStoreConfig('wsu_opc/design/plhovertextcolor');
        $color8 = Mage::getStoreConfig('wsu_opc/design/btnhovertextcolor');

        $color1 = $this->validateColor($color1);
        $color2 = $this->validateColor($color2);
        $color3 = $this->validateColor($color3);
        $color4 = $this->validateColor($color4);
        $color5 = $this->validateColor($color5);
        $color6 = $this->validateColor($color6);
        $color7 = $this->validateColor($color7);
        $color8 = $this->validateColor($color8);

        $styles = '';
        if (!empty($color4)) {
            $styles.=".opc-wrapper-opc .btn span, .opc-wrapper-opc .btn span span,";
            $styles.=".opc-wrapper-opc .discount-block .button span, .opc-wrapper-opc .discount-block .button span span,";
            $styles.=".opc-wrapper-opc .payment-block dt,";
            $styles.=".opc-wrapper-opc .giftcard .button span, .opc-wrapper-opc .giftcard .button span span,";
            $styles.=".opc-messages-action .button span, .opc-messages-action .button span span,";
            $styles.=".review-menu-block a.review-total, .expand_plus";
            $styles.="{background-color:{$color4} !important;;}";
            $styles.=".opc-wrapper-opc .opc-review-actions .view-agreement:hover{color:{$color4} !important;;}";
        }
        if (!empty($color5)) {
            $styles.=".opc-wrapper-opc .btn:hover span, .opc-wrapper-opc .btn:hover span span,";
            $styles.=".opc-wrapper-opc .discount-block .button:hover span, .opc-wrapper-opc .discount-block .button:hover span span,";
            $styles.=".opc-wrapper-opc .payment-block dt:hover, .opc-wrapper-opc .payment-block dt.active,";
            $styles.=".opc-messages-action .button:hover span, .opc-messages-action .button:hover span span,";
            $styles.=".discount-block h3:hover .expand_plus, .signature-block h3:hover .expand_plus, .comment-block h3:hover .expand_plus, .giftcard h3:hover .expand_plus,";
            $styles.=".discount-block h3.open-block .expand_plus, .signature-block h3.open-block .expand_plus, .comment-block h3.open-block .expand_plus, .giftcard h3.open-block .expand_plus";
            $styles.="{background-color:{$color5} !important;;}";
            $styles.=".review-menu-block a.review-total:hover, .review-menu-block a.review-total.open";
            $styles.="{background-color:{$color5} !important;}";
            $styles.=".review-menu-block .polygon{border-top-color:{$color5} !important;}";
        }
        if (!empty($color6)) {
            $styles.=".opc-wrapper-opc .discount-block .button span span,";
            $styles.=".opc-wrapper-opc .payment-block dt label,";
            $styles.=".opc-wrapper-opc .btn span span,";
            $styles.=".opc-wrapper-opc a:hover,";
            $styles.=".opc-wrapper-opc .giftcard .button span span,";
            $styles.=".opc-wrapper-opc .giftcard .check-gc-status span,";
            $styles.=".opc-messages-action .button span span,";
            $styles.=".review-menu-block a.review-total span, .review-menu-block a.review-total.open span,";
            $styles.=".expand_plus";
            $styles.="{color:{$color6} !important;;}";
        }
        if (!empty($color8)) {
            $styles.=".opc-wrapper-opc .discount-block .button:hover span span,";
            $styles.=".opc-wrapper-opc .payment-block dt:hover label, .opc-wrapper-opc .payment-block dt.active label,";
            $styles.=".opc-wrapper-opc .btn:hover span span,";
            $styles.=".opc-messages-action .button:hover span, .opc-messages-action .button:hover span span,";
            $styles.=".review-menu-block a.review-total:hover span, .review-menu-block a.review-total.open span,";
            $styles.=".opc-wrapper-opc a:hover,";
            $styles.="h3:hover .expand_plus,";
            $styles.="h3.open-block .expand_plus";
            $styles.="{color:{$color8} !important;;}";
        }

        if (!empty($color1)) {
            $styles.=".opc-wrapper-opc .btn-checkout span, .opc-wrapper-opc .btn-checkout span span,";
            $styles.=".opc-wrapper-opc .login-trigger";
            $styles.="{background-color:{$color1} !important;}";
            // setup color for disabled place order.
            $hex = str_replace('#', '', $color1);
            if (strlen($hex)==3) {
                $p1=substr($hex, 0, 1);
                $p1 = $p1.$p1;
                $p2=substr($hex, 1, 1);
                $p2 = $p2.$p2;
                $p3=substr($hex, 2, 1);
                $p3 = $p3.$p3;
            } else {
                $p1=substr($hex, 0, 2);
                $p2=substr($hex, 2, 2);
                $p3=substr($hex, 4, 2);
            }
            $p1 = ceil(hexdec($p1)/2);
            $p2 = ceil(hexdec($p2)/2);
            $p3 = ceil(hexdec($p3)/2);
            $styles.=".opc-wrapper-opc .btn-checkout.button-disabled span{background-color:rgba({$p1},{$p2},{$p3}, .8);}";
        }
        if (!empty($color2)) {
            $styles.=".opc-wrapper-opc .btn-checkout:hover span, .opc-wrapper-opc .btn-checkout:hover span span";
            $styles.="{background-color:{$color2} !important;;}";
            $styles.=".opc-wrapper-opc .login-trigger:hover";
            $styles.="{background-color:{$color2} !important;}";
        }
        if (!empty($color3)) {
            $styles.=".opc-wrapper-opc .login-trigger, .opc-wrapper-opc .btn-checkout span span";
            $styles.="{color:{$color3} !important;;}";
            $styles.=".opc-wrapper-opc .login-trigger:hover";
            $styles.="{color:{$color3} !important;}";
        }
        if (!empty($color7)) {
            $styles.=".opc-wrapper-opc .btn-checkout:hover span span";
            $styles.="{color:{$color7} !important;;}";
            $styles.=".opc-wrapper-opc .login-trigger:hover";
            $styles.="{color:{$color7} !important;}";
        }

        if (!empty($styles)) {
            $styles = "<style>{$styles}</style>";
        }

        return $styles;
    }
}
