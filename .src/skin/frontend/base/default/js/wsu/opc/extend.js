(function($,WSU){

    WSU.OPC.prepareExtendPaymentForm =  function(){
        $('.opc-col-left').hide();
        $('.opc-col-center').hide();
        $('.opc-col-right').hide();
        $('.opc-menu p.left').hide();
        $('#checkout-review-table-wrapper').hide();
        $('#checkout-review-submit').hide();

        $('.review-menu-block').addClass('payment-form-full-page');

    };

    WSU.OPC.backToOpc =  function(){
        $('.opc-col-left').show();
        $('.opc-col-center').show();
        $('.opc-col-right').show();
        $('#checkout-review-table-wrapper').show();
        $('#checkout-review-submit').show();

        //hide payments form
        $('#payflow-advanced-iframe').hide();
        $('#payflow-link-iframe').hide();
        $('#hss-iframe').hide();

        $('.review-menu-block').removeClass('payment-form-full-page');

        WSU.OPC.saveOrderStatus = false;

    };



    WSU.OPC.Plugin = {
        observer: {},
        dispatch: function(event, data){
            if ( WSU.OPC.defined(WSU.OPC.Plugin.observer[event]) ){
                var callback = WSU.OPC.Plugin.observer[event];
                callback(data);
            }
        },
        event: function(eventName, callback){
            WSU.OPC.Plugin.observer[eventName] = callback;
        }
    };

    /** 3D Secure Credit Card Validation - CENTINEL **/
    WSU.OPC.Centinel = {
        init: function(){

            if( WSU.OPC.defined(window.CentinelAuthenticateController) ){
                WSU.OPC.Plugin.event('savePaymentAfter', WSU.OPC.Centinel.validate);
            }
        },

        validate: function(){
            if ( WSU.OPC.defined(window.CentinelAuthenticateController) ){
                $('.opc-col-left').hide();
                $('.opc-col-center').hide();
                $('.opc-col-right').addClass('full-page');
            }
        },

        success: function(){
            if ( WSU.OPC.defined(window.CentinelAuthenticateController) ){
                $('.opc-col-right').removeClass('full-page');
                $('.opc-col-left').show();
                $('.opc-col-center').show();
            }
        }

    };


    //function toggleContinueButton(){}//dummy

    $(document).ready(function(){
        WSU.OPC.Centinel.init();
    });
})(jQuery,jQuery.WSU);
