;
var WSU=WSU||{};
WSU.LIPP = {
	config: null,
	
	init: function(){
		if (typeof(lippConfig)!="undefined"){
			this.config = jQuery.parseJSON(lippConfig);
			if (this.config.paypalLightBoxEnabled==true){
				this.initOnCart();
			}
		}
	}, 
	initOnCart: function(){
		jQuery('.checkout-types .paypal-logo a').click(function(e){
			e.preventDefault();
			WSU.LIPP.prepareToken();
		});
	},
	prepareToken: function(){
		WSU.LIPP.showLoader();
		jQuery.post(WSU.LIPP.config.baseUrl + 'onepage/express/start',{}, WSU.LIPP.prepareTokenResponse,'json');
	},
	prepareTokenResponse: function(response){
		WSU.LIPP.hideLoader();
		if (typeof(response.error)!="undefined"){
			if (response.error==false){
				PAYPAL.apps.Checkout.startFlow(WSU.LIPP.config.paypalexpress + response.token);
			}
			
			if (response.error==true){
				alert(response.message);
			}
		}
	},
	showLoader: function(){
		jQuery('.opc-ajax-loader').show();
	},
	hideLoader: function(){
		jQuery('.opc-ajax-loader').hide();
	},
};
jQuery(document).ready(function(){
	WSU.LIPP.init();
});