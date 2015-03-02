	;
	Billing =  Class.create();
	Shipping =  Class.create();
	var WSU=WSU||{};
	
	WSU.OPC = {
		agreements : null,
		saveOrderStatus:false,
		savingOrder:false,
		ready_billing:false,
		ready_shipping:false,
		ready_shipping_method:false,
		ready_payment_method:false,
		ready_discounts:false,
		ready_reviewed:false,
		initMessages: function(){
			jQuery('.close-message-wrapper, .opc-messages-action .button').on('click',function(e){
				e.preventDefault();
				jQuery('.opc-message-wrapper').hide();
				jQuery('.opc-message-container').empty();
			});
		},
		popup_message: function(html_message,sizeObj){
			sizeObj = sizeObj || {width: 350,minHeight: 25,}
			if(jQuery("#mess").length<=0)jQuery('body').append('<div id="mess">');
			jQuery("#mess").html((typeof html_message == 'string' || html_message instanceof String)?html_message:html_message.html());
			
			jQuery("#mess").prepend('<button style="float:right" id="ok" >Ok</button>');
			
			var defaultParams = {
				autoOpen: true,
				resizable: false,
				modal: true,
				draggable : false,
				create:function(){
					jQuery('.ui-dialog-titlebar').remove();
					jQuery(".ui-dialog-buttonpane").remove();
					jQuery('body').css({overflow:"hidden"});
				},
				buttons:{
					Ok:function(){
						jQuery( this ).dialog( "close" );
					}
				},
				open:function(){
					jQuery( "#ok" ).on('click',function(e){
						e.preventDefault();
						jQuery( "#mess" ).dialog( "close" );
					});
				},
				close: function() {
					jQuery('body').css({overflow:"auto"});
					jQuery( "#mess" ).dialog( "destroy" );
					jQuery( "#mess" ).remove();
				}																										
			}
			defaultParams = jQuery.extend(defaultParams,sizeObj);
			jQuery( "#mess" ).dialog(defaultParams);
		},
		ajaxManager: (function() {
			var requests = [];
			var requests_obj = {};
			 return {
				addReq:  function(action,opt) {
					if( jQuery.inArray(action, requests) > -1 ){
						//not this assums that the first one is what we wnt to use
					}else{
						requests.push(action);
						requests_obj[action]=opt;
						//console.log(requests);
						//console.log(requests_obj);
					}
				},
				removeReq:  function(action,opt) {
					if( jQuery.inArray(opt, requests) > -1 ){
						requests.splice(jQuery.inArray(action, requests), 1);
						delete requests_obj[action]; 
					}
				},
				run: function() {
					var self = this, oriSuc;
		
					if( requests.length ) {
						var action = requests[0];
						var post_obj = requests_obj[action];
						oriSuc = post_obj.complete;
		
						post_obj.complete = function() {
							 if( typeof(oriSuc) === 'function' ) oriSuc();
							 requests.shift();
							 self.run.apply(self, []);
							 //console.log(requests);
						};   
						jQuery.ajaxSetup({ cache: false });
						jQuery.ajax(post_obj);
					} else {
					  self.tid = setTimeout(function() {
						 self.run.apply(self, []);
					  }, 200);
					}
				},
				stop:  function() {
					requests = [];
					requests_obj = {};
					clearTimeout(this.tid);
				}
			 };
		}()),
		/** CREATE EVENT FOR SAVE ORDER **/
		initSaveOrder: function(){
			jQuery(document).on('click', '.opc-btn-checkout', function(e){
				e.preventDefault();
				var addressForm = new VarienForm('billing-new-address-form');
				if (!addressForm.validator.validate()){				
					return;
				}
				if (!jQuery('input[name="billing[use_for_shipping]"]').prop('checked')){
					var addressForm = new VarienForm('opc-address-form-shipping');
					if (!addressForm.validator.validate()){				
						return;
					}
				}
				WSU.OPC.saveOrderStatus = true;
				if (WSU.OPC.Checkout.isVirtual===false){
					if(WSU.OPC.ready_shipping_method===false){
						WSU.OPC.Shipping.saveShippingMethod();
					}else{
						if(WSU.OPC.ready_payment_method===false){
							WSU.OPC.validatePayment();
						}else{
							WSU.OPC.saveOrder();
						}
					}
				}else{
					if(WSU.OPC.ready_payment_method===false){
						WSU.OPC.validatePayment();
					}else{
						WSU.OPC.saveOrder();
					}
				}
			});
		},
		/** INIT CHAGE PAYMENT METHOD **/
		initPayment: function(){
			WSU.OPC.bindChangePaymentFields();
			jQuery( '#co-payment-form input[type="radio"]').removeAttr('onClick');
			jQuery(document).on('click', '#co-payment-form input[type="radio"]', function(e){
				
				jQuery('#co-payment-form').find('dd ul').hide();
				jQuery(this).closest('dt').next('dd').find('ul').show(function(){
					jQuery(this).find('input:disabled').attr("disabled",false);	
					jQuery(this).find('input').removeAttr("disabled");	
				});
				WSU.OPC.validatePayment();
			});
		},
		/** CHECK PAYMENT IF PAYMENT IF CHECKED AND ALL REQUIRED FIELD ARE FILLED PUSH TO SAVE **/
		validatePayment: function(){	
			payment.validate();
			var paymentMethodForm = new Validation('co-payment-form', { onSubmit : false, stopOnFirst : false, focusOnError : false});
			if (paymentMethodForm.validate()){					
				WSU.OPC.savePayment();
			}else{
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.bindChangePaymentFields();
			}
		},
		/** BIND CHANGE PAYMENT FIELDS **/ 
		bindChangePaymentFields: function(){
			WSU.OPC.unbindChangePaymentFields();
			
			jQuery('#co-payment-form input').on('keyup',function(e){
				e.preventDefault();
				clearTimeout(WSU.OPC.Checkout.formChanging);
				WSU.OPC.Checkout.formChanging = setTimeout(function(){
					if (WSU.OPC.Checkout.ajaxProgress!=false){
						clearTimeout(WSU.OPC.Checkout.ajaxProgress);
					}
					WSU.OPC.Checkout.ajaxProgress = setTimeout(function(){
						WSU.OPC.validatePayment();
					}, 1000);
				}, 500);
			});
			jQuery('#co-payment-form select').on('change',function(e){
				e.preventDefault();
				clearTimeout(WSU.OPC.Checkout.formChanging);
				WSU.OPC.Checkout.formChanging = setTimeout(function(){
					if (WSU.OPC.Checkout.ajaxProgress!=false){
						clearTimeout(WSU.OPC.Checkout.ajaxProgress);
					}
					WSU.OPC.Checkout.ajaxProgress = setTimeout(function(){
						WSU.OPC.validatePayment();
					}, 1000);
				}, 500);
			});
		},
	
		/** UNBIND CHANGE PAYMENT FIELDS **/
		unbindChangePaymentFields: function(){
			jQuery('#co-payment-form input').off('keyup');
			jQuery('#co-payment-form select').off('change');
		},
	
		/** SAVE PAYMENT **/		
		savePayment: function(){
			if (WSU.OPC.Checkout.xhr!=null){
				WSU.OPC.Checkout.xhr.abort();
			}
			var form = jQuery('#co-payment-form').serializeArray();
			WSU.OPC.Checkout.showLoader('.payment-block',"<h1>Saving payment choice</h1>");
			
			WSU.OPC.ajaxManager.addReq("savePayment",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/savePayment',
			   dataType: 'json',
			   data: form,
			   success: WSU.OPC.preparePaymentResponse
		   });
			
			
			
			//WSU.OPC.Checkout.xhr = jQuery.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/json/savePayment',form, WSU.OPC.preparePaymentResponse,'json');
		},
		/** CHECK RESPONSE FROM AJAX AFTER SAVE PAYMENT METHOD **/
		preparePaymentResponse: function(response){
			WSU.OPC.Checkout.hideLoader('.payment-block');					
			WSU.OPC.Checkout.xhr = null;
	
			WSU.OPC.agreements = jQuery('#checkout-agreements').serializeArray();
	
			if (typeof(response.review)!= "undefined" && WSU.OPC.saveOrderStatus===false){					
				jQuery('#review-block').html(response.review);
				if(jQuery( "tr:contains('Free Shipping - Free')" ).length){
					jQuery( "tr:contains('Free Shipping - Free')" ).hide();
				}
				WSU.OPC.Checkout.removePrice();
			}
	
			if (typeof(response.error) != "undefined"){
				WSU.OPC.Plugin.dispatch('error');
				WSU.OPC.popup_message(response.error);
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.ready_payment_method=false;
				return;
			}
			
			WSU.OPC.ready_payment_method=true;
			//SOME PAYMENT METHOD REDIRECT CUSTOMER TO PAYMENT GATEWAY
			if (typeof(response.redirect) != "undefined" && WSU.OPC.saveOrderStatus===true){
				WSU.OPC.Checkout.xhr = null;
				WSU.OPC.Plugin.dispatch('redirectPayment', response.redirect);
				if (WSU.OPC.Checkout.xhr==null){
					setLocation(response.redirect);
				}
				return;
			}
			if (WSU.OPC.saveOrderStatus===true){
				WSU.OPC.saveOrder();
			}
		},
	
		/** SAVE ORDER **/
		saveOrder: function(){
			var form = jQuery('#co-payment-form').serializeArray();
			form  = WSU.OPC.checkAgreement(form);
			WSU.OPC.Checkout.showLoader("#general_message","<h1>Processing order.</h1>");
			if (WSU.OPC.Checkout.config.comment!=="0"){
				WSU.OPC.saveCustomerComment();
			}
			
			WSU.OPC.Plugin.dispatch('saveOrder');
			WSU.OPC.savingOrder=true;
			
			WSU.OPC.ajaxManager.addReq("saveOrder",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.saveOrderUrl,
			   dataType: 'json',
			   data: form,
			   success: WSU.OPC.prepareOrderResponse
		   });
		},
	
		/** SAVE CUSTOMER COMMNET **/
		saveCustomerComment: function(){
			WSU.OPC.ajaxManager.addReq("saveComment",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/comment',
			   dataType: 'json',
			   data: {"comment": jQuery('#customer_comment').val()},
			   success: function(){}
		   });
		},
	
		/** ADD AGGREMENTS TO ORDER FORM **/
		checkAgreement: function(form){
			jQuery.each(WSU.OPC.agreements, function(index, data){
				form.push(data);
			});
			return form;
		},
	
		/** CHECK RESPONSE FROM AJAX AFTER SAVE ORDER **/
		prepareOrderResponse: function(response){
			if (typeof(response.error) != "undefined"){
				WSU.OPC.Checkout.hideLoader("#general_message");
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.popup_message(response.error);
				return;
			}
			if (typeof(response.redirect) !="undefined"){
				setLocation(response.redirect);
				return;
			}
			WSU.OPC.Plugin.dispatch('responseSaveOrder', response);
		}
	};
	
	WSU.OPC.Checkout = {
		config:null,
		ajaxProgress:false,
		xhr: null,
		isVirtual: false,
		disabledSave: false,
		saveOrderUrl: null,
	
		
		showLoader: function(parentBlock,message){
			var jObj = parentBlock!=="undefined" ? parentBlock:"#general_message";
			var html = message!=="undefined" ? message:"";
			if(jQuery(jObj+' .opc-ajax-loader .loader .message').length<=0){
				jQuery(jObj+' .opc-ajax-loader .loader').append("<div class='message'>"+html+"</div>");
			}else{
				jQuery(jObj+' .opc-ajax-loader .loader .message').html(html);
			}
			jQuery(jObj+' .opc-ajax-loader').show();
			jQuery('.opc-btn-checkout').attr("disabled",true);
			//console.log("masking "+jObj+" with a message of "+html);
		},
		
		hideLoader: function(parentBlock){
			var jObj = parentBlock!=="undefined"? parentBlock:"#general_message";
			jQuery(jObj+' .opc-ajax-loader').hide();
			jQuery(jObj+' .opc-ajax-loader .loader .message').remove();
			jQuery('.opc-btn-checkout').removeAttr("disabled");
			//console.log("hidgin mask of "+jObj+" with a message of ");
		},
	
		
		init:function(){		
			
			if (this.config==null){
				return;
			}
			WSU.OPC.ajaxManager.run(); 
			//base config
			this.config = jQuery.parseJSON(this.config);
			
			this.saveOrderUrl = WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveOrder',
			
			//DECORATE
			this.clearOnChange();
			this.removePrice();
	
			//MAIN FUNCTION
			WSU.OPC.Billing.init();
			WSU.OPC.Shipping.init();	
			WSU.OPC.initMessages();
			WSU.OPC.initSaveOrder();
	
			if (this.config.isLoggedIn===1){
				var addressId = jQuery('#billing-address-select').val();
				if (addressId!='' && addressId!=undefined ){
					WSU.OPC.Billing.save();
				}else{
					//FIX FOR MAGENTO 1.8 - NEED LOAD PAYTMENT METHOD BY AJAX
					WSU.OPC.Checkout.pullPayments();
				}
			}else{
				//FIX FOR MAGENTO 1.8 - NEED LOAD PAYTMENT METHOD BY AJAX
				WSU.OPC.Checkout.pullPayments();
			}		
			WSU.OPC.initPayment();
		},
		/** PARSE RESPONSE FROM AJAX SAVE BILLING AND SHIPPING METHOD **/
		prepareAddressResponse: function(response){
			WSU.OPC.Checkout.xhr = null;
			if (typeof(response.error) != "undefined"){
				//jQuery('.opc-message-container').html(response.message);
				//jQuery('.opc-message-wrapper').show();
				
				WSU.OPC.popup_message(response.message);
	
				WSU.OPC.Checkout.hideLoader("#opc-address-form-billing");
				return;
			}
			
			if(typeof(response.exists) != "undefined" && response.exists===true){
				if(jQuery("#existing").length<=0){
					jQuery('#opc-address-form-billing .form-list').before('<b id="existing">This email exists.  Try loging in above</b>');
				}
				jQuery("#existing").removeClass('unhighlight');
				jQuery("#existing").addClass("highlight");
				setTimeout(function(){
					jQuery("#existing").addClass('unhighlight');
					jQuery("#existing").removeClass('highlight');
				}, 900);
			}
	
			if (typeof(response.shipping) != "undefined"){
				jQuery('#shipping-block-methods').empty().html(response.shipping);
			}
	
			if (typeof(response.payments) != "undefined"){				
				jQuery('#checkout-payment-method-load').empty().html(response.payments);
				payment.initWhatIsCvvListeners();//default logic for view "what is this?"
			}
	
			if (typeof(response.isVirtual) != "undefined"){
				WSU.OPC.Checkout.isVirtual = true;
			}
	
			WSU.OPC.Checkout.updatePaymentBlock = true;
			WSU.OPC.Checkout.hideLoader("#opc-address-form-billing");
			WSU.OPC.Checkout.hideLoader("#opc-address-form-shipping");
			WSU.OPC.Checkout.pullPayments(function(){
				if (WSU.OPC.Checkout.isVirtual===false){
					if(WSU.OPC.ready_shipping_method===false){
						WSU.OPC.Shipping.saveShippingMethod();
					}
				}else{
					jQuery('.shipping-block').hide();
					jQuery('.payment-block').addClass('clear-margin');
				}
			});
	
		},
	
		/** PARSE RESPONSE FROM AJAX SAVE SHIPPING METHOD **/
		prepareShippingMethodResponse: function(response){
			WSU.OPC.Checkout.xhr = null;
			WSU.OPC.Checkout.hideLoader(".shipping-method-block");
	
			if (typeof(response.error)!="undefined"){
				WSU.OPC.Plugin.dispatch('error');
				WSU.OPC.popup_message(response.message);
				WSU.OPC.saveOrderStatus = false;
				return;
			}
	
			if (typeof(response.review)!="undefined" && WSU.OPC.saveOrderStatus===false){
				jQuery('.review-block').html(response.review);
				jQuery('.review-block #checkout-review-table').addClass('price_change_highlight');
				clearTimeout(WSU.OPC.Checkout.formChanging);
					WSU.OPC.Checkout.formChanging = setTimeout(function(){
						jQuery('.review-block #checkout-review-table').addClass('un_highlight');
						jQuery('.review-block #checkout-review-table').removeClass('price_change_highlight');
					}, 800);
				WSU.OPC.Checkout.removePrice();
			}
			WSU.OPC.ready_shipping_method=true;
			//IF STATUS TRUE - START SAVE PAYMENT FOR CREATE ORDER
			if (WSU.OPC.saveOrderStatus==true){
				WSU.OPC.validatePayment();
			}else{
				//WSU.OPC.Checkout.pullPayments(); thinking about it, it seem redundent to pull payments when it's just the method of shipping change.  not one way i can think of to tie the two so why tie the two.
			}
		},
	
		clearOnChange: function(){
			jQuery('.opc-col-left input, .opc-col-left select').removeAttr('onclick').removeAttr('onchange');
		},
		
		removePrice: function(){
			jQuery('.opc-data-table tr th:nth-child(2)').remove();
			jQuery('.opc-data-table tbody tr td:nth-child(2)').remove();
			jQuery('.opc-data-table tfoot td').each(function(){
				var colspan = jQuery(this).attr('colspan');
				if (colspan!="" && colspan !=undefined){
					colspan = parseInt(colspan) - 1;
					jQuery(this).attr('colspan', colspan);
				}
			});
	
			var th=jQuery('.opc-data-table tfoot th');
			jQuery.each(th,function(){
				var colspan = jQuery(this).attr('colspan');
				if (colspan!="" && colspan !=undefined){
					colspan = parseInt(colspan) - 1;
					jQuery(this).attr('colspan', colspan);
				}
			});
		},
	
		
		/** APPLY SHIPPING METHOD FORM TO BILLING FORM **/
		applyShippingMethod: function(form){
			formShippimgMethods = jQuery('#opc-co-shipping-method-form').serializeArray();
			jQuery.each(formShippimgMethods, function(index, data){
				form.push(data);
			});
			return form;
		},
		
		/** APPLY NEWSLETTER TO BILLING FORM **/
		applySubscribed: function(form){
			if (jQuery('#is_subscribed').length){
				if (jQuery('#is_subscribed').is(':checked')){
					form.push({"name":"is_subscribed", "value":"1"});
				}
			}
			return form;
		},
		
		/** PULL REVIEW **/
		pullReview: function(){
			WSU.OPC.Checkout.showLoader('#review-block',"<h1>Recalulating</h1>");
			
			
			WSU.OPC.ajaxManager.addReq("saveReview",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/review',
			   dataType: 'json',
			   success:function(response){
					WSU.OPC.Checkout.hideLoader('.review-block');
					if (typeof(response.review)!="undefined"){
						jQuery('#review-block').html(response.review);
						WSU.OPC.Checkout.removePrice();
					}
					if(jQuery( "tr:contains('Free Shipping - Free')" ).length){
						jQuery( "tr:contains('Free Shipping - Free')" ).hide();
					}
					WSU.OPC.Agreement.init();
				}
		   });
		},
		
		/** PULL PAYMENTS METHOD AFTER LOAD PAGE **/
		pullPayments: function(callback){
			WSU.OPC.Checkout.showLoader('.payment-block',"<h1>Getting payment choices</h1>");
			
			WSU.OPC.ajaxManager.addReq("savePayments",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/payments',
			   dataType: 'json',
			   success:function(response){
					WSU.OPC.Checkout.hideLoader('.payment-block');
					if (typeof(response.error)!="undefined"){
						WSU.OPC.popup_message(response.error);
						WSU.OPC.saveOrderStatus = false;
						return;
					}
					if (typeof(response.payments)!="undefined"){
						jQuery('#co-payment-form').html("<fieldset>"+response.payments+"</fieldset>");
						payment.initWhatIsCvvListeners();
						WSU.OPC.bindChangePaymentFields();
					};
					WSU.OPC.Checkout.pullReview();
					(callback||null)?callback():null;
				}
		   });
		}
	};
	
	
	WSU.OPC.Billing = {
		init: function(){
			//set flag use billing for shipping and init change flag
			this.setBillingForShipping(true);
			jQuery('input[name="billing[use_for_shipping]"]').on('change',function(e){
				e.preventDefault();
				WSU.OPC.ready_shipping_method=false;
				if (jQuery(this).is(':checked')){
					WSU.OPC.Billing.setBillingForShipping(true);
					jQuery('#opc-address-form-billing select[name="billing[country_id]"]').change();
				}else{
					WSU.OPC.Billing.setBillingForShipping(false);					
				}
			});
			//update password field
			jQuery('input[name="billing[create_account]"]').on('change',function(e){
				e.preventDefault();
				if (jQuery(this).is(':checked')){
					jQuery(this).attr('checked',true);
					jQuery('#register-customer-password').removeClass('hidden');
					jQuery('input[name="billing[customer_password]"]').addClass('required-entry').attr('required',true);
					jQuery('input[name="billing[confirm_password]"]').addClass('required-entry').attr('required',true);
				}else{
					jQuery(this).removeAttr('checked');
					jQuery('#register-customer-password').addClass('hidden');
					jQuery('input[name="billing[customer_password]"]').removeClass('required-entry').removeAttr('required');
					jQuery('input[name="billing[confirm_password]"]').removeClass('required-entry').removeAttr('required');
					jQuery('#register-customer-password input').val('');
				}
			});
			this.initChangeAddress();
			this.initChangeSelectAddress();
		},
		
		/** CREATE EVENT FOR UPDATE SHIPPING BLOCK **/
		initChangeAddress: function(){
			jQuery('#opc-address-form-billing input').on('keyup',function(e){
				e.preventDefault();
				
				if(jQuery(this).is(jQuery('.shipping_method_value'))){
					WSU.OPC.ready_shipping_method=false;	
				}
				
				if( jQuery('#opc-address-form-billing select[required]').filter(function() { return $(this).val() == ""; }).length==0
					&& jQuery('#opc-address-form-billing input[required]').filter(function() { return $(this).val() == ""; }).length==0
				){
					clearTimeout(WSU.OPC.Checkout.formChanging);
					WSU.OPC.Checkout.formChanging = setTimeout(function(){
						WSU.OPC.Billing.validateForm();
					}, 500);
					
					
					
				}
			});
			jQuery('#opc-address-form-billing select').not('#billing-address-select').on('change',function(e){
				e.preventDefault();
				if( jQuery('#opc-address-form-billing select[required]').filter(function() { return $(this).val() == ""; }).length==0
					&& jQuery('#opc-address-form-billing input[required]').filter(function() { return $(this).val() == ""; }).length==0
				){
					clearTimeout(WSU.OPC.Checkout.formChanging);
					WSU.OPC.Checkout.formChanging = setTimeout(function(){
						WSU.OPC.Billing.validateForm();
					}, 500);
				}
			});
		},
		
		validateForm: function(){
			var valid = WSU.OPC.Billing.validateAddressForm();
			if (valid){
				WSU.OPC.Billing.save();
			}
		},
	
		/** CREATE EVENT FOR CHANGE ADDRESS TO NEW OR FROM ADDRESS BOOK **/
		initChangeSelectAddress: function(){
			jQuery('#billing-address-select').on('change',function(e){
				e.preventDefault();
				if (jQuery(this).val()==''){
					jQuery('#billing-new-address-form').show();
				}else{
					jQuery('#billing-new-address-form').hide();
					WSU.OPC.Billing.validateForm();
				}
			});
		},
		
		/** VALIDATE ADDRESS BEFORE SEND TO SAVE QUOTE**/
		validateAddressForm: function(form){
		  var addressForm = new Validation('opc-address-form-billing', { onSubmit : false, stopOnFirst : false, focusOnError : false});
		  if (addressForm.validate()){				  		 
			  return true;
		  }else{				 
			  return false;
		  }
		},
		
		/** SET SHIPPING AS BILLING TO TRUE OR FALSE **/
		setBillingForShipping:function(useBilling){
			if (useBilling==true){
				jQuery('input[name="billing[use_for_shipping]"]').prop('checked', true);
				jQuery('input[name="shipping[same_as_billing]"]').prop('checked', true);
				jQuery('#opc-address-form-shipping').addClass('hidden');				
			}else{
				this.pushBilingToShipping();	
				jQuery('input[name="billing[use_for_shipping]"]').prop('checked', false);
				jQuery('input[name="shipping[same_as_billing]"]').prop('checked', false);
				jQuery('#opc-address-form-shipping').removeClass('hidden');
			}
		},
		
		/** COPY FIELD FROM BILLING FORM TO SHIPPING **/
		pushBilingToShipping:function(clearShippingForm){
			//pull country
			var valueCountry = jQuery('#billing-new-address-form select[name="billing[country_id]"]').val();
			jQuery('#opc-address-form-shipping  select[name="shipping[country_id]"] [value="' + valueCountry + '"]').prop("selected", true);	
			shippingRegionUpdater.update();
	
			//pull region id
			var valueRegionId = jQuery('#billing-new-address-form select[name="billing[region_id]"]').val();
			jQuery('#opc-address-form-shipping  select[name="shipping[region_id]"] [value="' + valueRegionId + '"]').prop("selected", true);
			
			//pull other fields	
			var billingInputs = jQuery('#billing-new-address-form input').not(':hidden, :input[type="checkbox"]');
			jQuery.each(billingInputs,function(){
				var name = jQuery(this).attr('name');
				var value = jQuery(this).val();
				var shippingName =  name.replace( /billing/ , 'shipping');
				
				jQuery('#opc-address-form-shipping input[name="'+shippingName+'"]').val(value);
			});
			
			//pull address field
			jQuery('#billing-new-address-form input[name="billing[street][]"]').each(function(indexBilling){
				var valueAddress = jQuery(this).val();
				jQuery('#opc-address-form-shipping input[name="shipping[street][]"]').each(function(indexShipping){
					if (indexBilling==indexShipping){
						jQuery(this).val(valueAddress);
					}
				});				
			});
			
			//init trigger change shipping form
			jQuery('#opc-address-form-shipping select[name="shipping[country_id]"]').change();
		},
	
		/** METHOD CREATE AJAX REQUEST FOR UPDATE SHIPPING METHOD **/
		save: function(){
			
			var form = jQuery('#opc-address-form-billing').serializeArray();
			form = WSU.OPC.Checkout.applyShippingMethod(form);		 			
			form = WSU.OPC.Checkout.applySubscribed(form); 
			form.push({ "name":"billing[use_for_shipping]", "value": jQuery('[name*=use_for_shipping]:checked').length });
			WSU.OPC.Checkout.showLoader("#opc-address-form-billing","<h1>Saving billing information</h1>");
			WSU.OPC.ajaxManager.addReq("saveBilling",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveBilling',
			   dataType: 'json',
			   data: form,
			   success:WSU.OPC.Checkout.prepareAddressResponse
		   });
		}
	};
	
	WSU.OPC.Shipping = {
		init: function(){
			this.initChangeAddress();
			this.initChangeSelectAddress();
			this.initChangeShippingMethod();
		},
	
		/** CREATE EVENT FOR UPDATE SHIPPING BLOCK **/
		initChangeAddress: function(){
			jQuery('#opc-address-form-shipping input').on('keyup',function(e){
				e.preventDefault();
				WSU.OPC.Shipping.validateForm();
			});
			jQuery('#opc-address-form-shipping select').not('#shipping-address-select').on('change',function(e){
				e.preventDefault();
				WSU.OPC.Shipping.validateForm();
			});
		},
		
		/** CREATE VENT FOR CHANGE ADDRESS TO NEW OR FROM ADDRESS BOOK **/
		initChangeSelectAddress: function(){
			jQuery('#shipping-address-select').on('change',function(e){
				e.preventDefault();
				if (jQuery(this).val()==''){
					jQuery('#shipping-new-address-form').show();
				}else{
					jQuery('#shipping-new-address-form').hide();
					WSU.OPC.Shipping.validateForm();
				}
			});
		},
		
		//create observer for change shipping method. 
		initChangeShippingMethod: function(){
			jQuery('.opc-wrapper-opc #shipping-block-methods').on('change', 'input[type="radio"]', function(){
				WSU.OPC.Shipping.saveShippingMethod();
			});
		},
		
		validateForm: function(){
			var valid = WSU.OPC.Shipping.validateAddressForm();
			if (valid){
				WSU.OPC.Shipping.save();
			}
		},
		
		/** VALIDATE ADDRESS BEFORE SEND TO SAVE QUOTE**/
		validateAddressForm: function(form){
			  var addressForm = new Validation('opc-address-form-shipping', { onSubmit : false, stopOnFirst : false, focusOnError : false});
			  if (addressForm.validate()){				  		 
				  return true;
			  }else{				 
				  return false;
			  }
		},
		
		/** METHOD CREATE AJAX REQUEST FOR UPDATE SHIPPIN METHOD **/
		save: function(){
			
			
				var form = jQuery('#opc-address-form-shipping').serializeArray();
				form = WSU.OPC.Checkout.applyShippingMethod(form);
				WSU.OPC.Checkout.showLoader("#opc-address-form-shipping","<h1>Saving shipping address</h1>");
				WSU.OPC.ajaxManager.addReq("saveShipping",{
				   type: 'POST',
				   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveShipping',
				   dataType: 'json',
				   data: form,
				   success:WSU.OPC.Checkout.prepareAddressResponse
			   });
		},
		
		saveShippingMethod: function(){
			if (WSU.OPC.Shipping.validateShippingMethod()===false){
				WSU.OPC.popup_message('Please specify shipping method');
				WSU.OPC.Checkout.hideLoader();
				return;
			}
			
			var form = jQuery('#opc-co-shipping-method-form').serializeArray();
			form = WSU.OPC.Checkout.applySubscribed(form); 
			WSU.OPC.Checkout.showLoader(".shipping-method-block","<h1>Saving shipping choice</h1>");
			WSU.OPC.ajaxManager.addReq("saveShippingMethod",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveShippingMethod',
			   dataType: 'json',
			   data: form,
			   success:WSU.OPC.Checkout.prepareShippingMethodResponse
		   });
		},
		validateShippingMethod: function(){			
			var shippingChecked = false;
			if(jQuery('#opc-co-shipping-method-form #checkout-shipping-method-load input').length){
				jQuery('#opc-co-shipping-method-form #checkout-shipping-method-load input').each(function(){				
					if (jQuery(this).prop('checked')){							
						shippingChecked =  true;
					}
				});
			}else{
				shippingChecked =  true;
			}
			return shippingChecked;
		}
	};
	
	
	WSU.OPC.Coupon = {
		init: function(){
			jQuery('.apply-coupon').on('click', function(e){
				e.preventDefault();
				WSU.OPC.Coupon.applyCoupon(false);
			});
			jQuery('.remove-coupon').on('click', function(e){
				e.preventDefault();
				WSU.OPC.Coupon.applyCoupon(true);
			});
		},
	
		applyCoupon: function(remove){
			var form = jQuery('#opc-discount-coupon-form').serializeArray();
			if (remove===false){				
				form.push({"name":"remove", "value":"0"});
			}else{
				form.push({"name":"remove", "value":"1"});
			}
			WSU.OPC.Checkout.showLoader('.discount-block');
			
	
			WSU.OPC.ajaxManager.addReq("couponPost",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/coupon/couponPost',
			   dataType: 'json',
			   data: form,
			   success:WSU.OPC.Coupon.prepareResponse
		   });
		},
	
		prepareResponse: function(response){
			WSU.OPC.Checkout.hideLoader(".discount-block");
			if (typeof(response.message) != "undefined"){
				WSU.OPC.popup_message(response.message);
				WSU.OPC.ready_payment_method=false;
				WSU.OPC.Checkout.pullPayments();
				WSU.OPC.Checkout.pullReview();
			}
			if (typeof(response.coupon) != "undefined" && response.coupon!==""){
				jQuery('.discount-block').html(response.coupon);
			}
			WSU.OPC.Coupon.init();
		}
	};
	
	WSU.OPC.Agreement ={
		init: function(){
			jQuery('.view-agreement').off().on('click', function(e){
				e.preventDefault();
	
				var id = jQuery(this).data('id');
				var title = jQuery(this).find('span').html();
				var content = jQuery('#agreement-block-'+id).html();
	
				jQuery('#agreement-title').html(title);
				jQuery('#agreement-modal-body').html(content);
	
				var defaultParams = {
					autoOpen: true,
					resizable: false,
					modal: true,
					draggable : false,
					width: 350,
					create:function(){
						jQuery('.ui-dialog-titlebar').remove();
						jQuery(".ui-dialog-buttonpane").remove();
						jQuery('body').css({overflow:"hidden"});
					},
					buttons:{
						Ok:function(){
							jQuery('#agreement-dialog').dialog( "close" );
						}
					},
					open:function(){
						jQuery('.ui-dialog-titlebar').remove();
						jQuery(".ui-dialog-buttonpane").remove();
						jQuery('body').css({overflow:"hidden"});
						jQuery( "#agreement-dialog .close" ).on('click',function(e){
							e.preventDefault();
							jQuery( "#agreement-dialog" ).dialog( "close" );
						});
					},
					close: function() {
						jQuery('body').css({overflow:"auto"});
					}																										
				}
				jQuery('#agreement-dialog').dialog(defaultParams);
			});
			
		}
	};
	
	WSU.OPC.Login ={
		init: function(){
			
			jQuery('#trig_login_form').on('click',function(e){
				e.preventDefault();
				
				var defaultParams = {
					autoOpen: true,
					resizable: false,
					modal: true,
					draggable : false,
					width: 350,
					create:function(){
						jQuery('.ui-dialog-titlebar').remove();
						jQuery(".ui-dialog-buttonpane").remove();
						jQuery('body').css({overflow:"hidden"});
					},
					buttons:{
						Ok:function(){
							jQuery( this ).dialog( "close" );
						}
					},
					open:function(){
						jQuery('.ui-dialog-titlebar').remove();
						jQuery(".ui-dialog-buttonpane").remove();
						jQuery('body').css({overflow:"hidden"});
						jQuery( "#login_form_modal .close" ).on('click',function(e){
							e.preventDefault();
							jQuery( "#login_form_modal" ).dialog( "close" );
						});
						jQuery('.restore-account').on('click',function(e){
							e.preventDefault();
							jQuery('#login-form').hide();
							jQuery('#login-button-set').hide();
							jQuery('#form-validate-email').fadeIn();
							jQuery('#forgotpassword-button-set').show();
						});
						jQuery('#login-button-set .btn').on("click",function(e){
							e.preventDefault();
							jQuery('#login-form').submit();
						});
						jQuery('#forgotpassword-button-set .btn').on("click",function(e){
							e.preventDefault();
							var form = jQuery('#form-validate-email').serializeArray();
							WSU.OPC.Checkout.showLoader();
							WSU.OPC.Checkout.xhr = jQuery.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/json/forgotpassword',form, WSU.OPC.Login.prepareResponse,'json');
						});
						jQuery('#forgotpassword-button-set .back-link').on("click",function(e){
							e.preventDefault();
							jQuery('#form-validate-email').hide();
							jQuery('#forgotpassword-button-set').hide();
							jQuery('#login-form').fadeIn();
							jQuery('#login-button-set').show();
						});
					},
					close: function() {
						jQuery('body').css({overflow:"auto"});
					}																										
				}
				jQuery('#login_form_modal').dialog(defaultParams);
			});
			
		},
		prepareResponse: function(response){
			WSU.OPC.Checkout.hideLoader();
			if (typeof(response.error)!="undefined"){
				alert(response.message);
			}else{
				alert(response.message);
				jQuery('#forgotpassword-button-set .back-link').click();
			}
		}
	};
	
	WSU.OPC.Geo = {
		init: function(){
			if (WSU.OPC.Checkout.config.geoCountry===false){			
				return;
			}else{
				//setup country for billing and than for shipping
				if (jQuery('#opc-address-form-billing select[name="billing[country_id]"]').is(":visible")){					
					jQuery('#opc-address-form-billing select[name="billing[country_id]"]').val(WSU.OPC.Checkout.config.geoCountry);
					billingRegionUpdater .update();
				}				
			}
			if (WSU.OPC.Checkout.config.geoCity===false){			
				return;
			}else{
				jQuery('#opc-address-form-billing [name="billing[city]"]').val(WSU.OPC.Checkout.config.geoCity);														
			}
		}
	};
	
	jQuery(document).ready(function(){
		WSU.OPC.Checkout.init();
		WSU.OPC.Coupon.init();
		WSU.OPC.Agreement.init();
		WSU.OPC.Login.init();
		WSU.OPC.Geo.init();
	});