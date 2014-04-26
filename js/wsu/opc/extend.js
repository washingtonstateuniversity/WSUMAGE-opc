WSU.OPC.Plugin = {
	observer: {},
	dispatch: function(event, data){
		console.debug('DISPATCH::EVENT::' + event);			
		if (typeof(WSU.OPC.Plugin.observer[event]) !="undefined"){
			var callback = WSU.OPC.Plugin.observer[event];
			callback(data);
		}
	},
	event: function(eventName, callback){
		WSU.OPC.Plugin.observer[eventName] = callback;
	}
};

/** PAYPAL EXPRESS CHECKOUT LIGHTBOX **/
WSU.OPC.Lipp = {
	init: function(){
		if (WSU.OPC.Checkout.config.paypalLightBoxEnabled==true){
			WSU.OPC.Plugin.event('redirectPayment', WSU.OPC.Lipp.checkPaypalExpress);
		}
	},
	checkPaypalExpress:function(url){
		WSU.OPC.Checkout.showLoader();
		try{
			if (url.match(/paypal\/express\/start/i)){
				WSU.OPC.Checkout.xhr = true;
				WSU.OPC.Lipp.prepareToken();
			}
		
		}catch(e){
			WSU.OPC.Checkout.xhr = null;
		}
	},
	prepareToken: function(){
		jQuery.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/express/start',{"redirect":'onepage'}, WSU.OPC.Lipp.prepareTokenResponse,'json');
	},
	prepareTokenResponse: function(response){
		if (typeof(response.error)!="undefined"){
			if (response.error==false){
				WSU.OPC.Checkout.hideLoader();
				PAYPAL.apps.Checkout.startFlow(WSU.OPC.Checkout.config.paypalexpress + response.token);
			}
			if (response.error==true){
				alert(response.message);
			}
		}
	}
}

jQuery(document).ready(function(){
	WSU.OPC.Lipp.init(); 
});
