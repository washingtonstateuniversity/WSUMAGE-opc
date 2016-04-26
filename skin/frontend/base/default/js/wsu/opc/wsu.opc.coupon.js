(function($,WSU){
	WSU.OPC.Coupon = {
		init: function(){
			
			$(document).on('click', '.apply-coupon', function(){
				WSU.OPC.Coupon.applyCoupon(false);
			});
			
			
			$(document).on('click', '.remove-coupon', function(){
				WSU.OPC.Coupon.applyCoupon(true);
			});
			
			
			$(document).on('click','.discount-block h3', function(){
				if ($(this).hasClass('open-block')){
					$(this).removeClass('open-block');
					$(this).next().addClass('hidden');
				}else{
					$(this).addClass('open-block');					
					$(this).next().removeClass('hidden');
				}
			});
			
		},
		
		applyCoupon: function(remove){
			var form = jQuery('#opc-discount-coupon-form').serializeArray();
			if (remove === false){				
				form.push({"name":"remove", "value":"0"});
			}else{
				form.push({"name":"remove", "value":"1"});
			}
			WSU.OPC.Decorator.showLoader('.discount-block');
			
	
			WSU.OPC.ajaxManager.addReq("couponPost",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/coupon/couponPost',
			   dataType: 'json',
			   data: form,
			   success:WSU.OPC.Coupon.prepareResponse
		   });
		},
		
		prepareResponse: function(response){
			WSU.OPC.Decorator.hideLoader(".discount-block");
			if ( WSU.OPC.defined(response.message) ){
				WSU.OPC.popup_message(response.message);
				WSU.OPC.ready_payment_method=false;
				//WSU.OPC.Checkout.pullPayments();
				WSU.OPC.Checkout.pullReview();
			}
			if ( WSU.OPC.defined(response.coupon) && "" !== response.coupon){
				$('#opc-discount-coupon-form').replaceWith(response.coupon).show();				
				$('#opc-discount-coupon-form').show();
				//$('.discount-block').html(response.coupon);
			}
			if ( WSU.OPC.defined(response.payments) ){
				$('#checkout-payment-method-load').html(response.payments);
				
				WSU.OPC.removeNotAllowedPaymentMethods();
				
				payment.initWhatIsCvvListeners();
				WSU.OPC.bindChangePaymentFields();
			};	
			WSU.OPC.Coupon.init();	
		}
	};
})(jQuery,jQuery.WSU||{});