;
var WSU=WSU||{};
WSU.Paypal = {
	Login : {
		init: function(){
			jQuery('#topPayPalIn').click(function(event){
				event.preventDefault();
				WSU.Paypal.Login.showDialog(jQuery(this).attr('href'));
			});
			jQuery('#login-with-paypal').click(function(event){
				event.preventDefault();
				WSU.Paypal.Login.showDialog(jQuery(this).attr('href'));
			});
		},
		showDialog: function(url){
			mywindow = window.open (url, "_PPIdentityWindow_", "location=1, status=0, scrollbars=0, width=400, height=550");
		}
	}
};
jQuery(document).ready(function(){
	WSU.Paypal.Login.init();
});