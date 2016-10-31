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
		$(document).ready(function(){
        if($("#alumni_coupon_code").length){
            var alum_code = $("#real_dis_code").val();
            var mess = $(".success-msg span").text();
            if(mess.indexOf("alumni102948274sjs1")>0){
                $(".success-msg span").text('Your Alumni discount was applied.');
            }
            if("undefined" !== alum_code){
                if("" !== alum_code && "alumni102948274sjs1" === alum_code){
                    console.log("already had it alumni");
                    console.log("---"+alum_code+"----");
                    $("#discount-coupon-form-inline").hide();
                }else if("" !== alum_code){
                     console.log("already had it alumni");
                    console.log("---"+alum_code+"----");
                    $("#alumni_discount-coupon-form").hide();           
                }
            }
            
            $("#alumni_coupon_code").on("keyup",function(){
                console.log("typing in alumni");
                var code = $(this).val();
                if(code.length>0){
                    console.log("setting  alumni");
                    $("#real_dis_code").val("alumni102948274sjs1");
                    $("#discount-coupon-form-inline").fadeOut();
                }else{
                    console.log("re---setting  alumni");
                    $("#real_dis_code").val("");
                    $("#discount-coupon-form-inline").fadeIn();
                }
            });
            $("#coupon_code_shim").on("keyup",function(){
                var code = $(this).val();
                if(code.length>0){
                    $("#real_dis_code").val(code);
                    $("#alumni_discount-coupon-form").fadeOut();
                }else{
                    console.log("re---setting  alumni");
                    $("#real_dis_code").val("");
                    $("#alumni_discount-coupon-form").fadeIn();
                }
            });
            
            $(".alum-remove-coupon").on("click", function(){
                console.log("trying to clear");
                $("#real_dis_code").val("");
                $("#discount-coupon-form-inline input[type='text']").val("");
                $("#alumni_discount-coupon-form input[type='text']").val("");
                WSU.OPC.Coupon.applyCoupon(true);
            });
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