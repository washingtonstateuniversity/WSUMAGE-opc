jQuery.WSU=jQuery.WSU||{};
(function($,WSU){
	WSU.LIPP = {
		config: null,
		lipp_enabled: false,
		
		init: function(){
			if (typeof(lippConfig)!=="undefined"){
				this.config = $.parseJSON(lippConfig);
				if (this.config.paypalLightBoxEnabled==true){
					this.initOPC();
					this.initOnCart();
				}
			}
		}, 
		
		initOPC: function(){
			
			WSU.LIPP.lipp_enabled = true;
			
			$(document).on('click', '.opc-wrapper-opc #checkout-payment-method-load .radio', function(e){
				var method = payment.currentMethod;
				if (method.indexOf('paypaluk_express')!==-1 || method.indexOf('paypal_express')!==-1){
					if (WSU.OPC.Checkout.config.comment!=="0"){
						WSU.OPC.saveCustomerComment();
					}
				}
			});
	
		},
		
		redirectPayment: function(){
			PAYPAL.apps.Checkout.startFlow(WSU.LIPP.config.baseUrl + 'onepage/express/start');
			return false;
		},
		
		initOnCart: function(){
			$('.checkout-types .paypal-logo a, .opc-menu .paypal-logo a').click(function(e){		
				e.preventDefault();
				PAYPAL.apps.Checkout.startFlow(WSU.LIPP.config.baseUrl + 'onepage/express/start');
			});
		}	
	};
	
	$(document).ready(function(){
		WSU.LIPP.init();
	});
})(jQuery,jQuery.WSU);