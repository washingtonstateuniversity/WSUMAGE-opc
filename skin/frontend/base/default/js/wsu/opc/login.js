jQuery.WSU=jQuery.WSU||{OPC:{Checkout:{config:{}}}};
(function($,WSU,OPC){
	WSU.Paypal = {
		Login : {
			init: function(){
				$('#topPayPalIn').click(function(event){
					event.preventDefault();
					WSU.Paypal.Login.showDialog($(this).attr('href'));
				});
				
				$('#login-with-paypal').click(function(event){
					event.preventDefault();
					WSU.Paypal.Login.showDialog($(this).attr('href'));
				});
			},
			
			showDialog: function(url){
				mywindow = window.open (url, "_PPIdentityWindow_", "location=1, status=0, scrollbars=0, width=400, height=550");
			}
		}
	};
	
	$(document).ready(function(){
		WSU.Paypal.Login.init();
	});
})(jQuery,jQuery.WSU,jQuery.WSU.OPC);