jQuery.WSU=jQuery.WSU||{};
(function($,WSU){
	Billing =  Class.create();
	Shipping =  Class.create();
	WSU.OPC = {
		agreements : null,
		saveOrderStatus:false,
		is_subscribe:false,
			
//too old??
		savingOrder:false,
		ready_billing:false,
		ready_shipping:false,
		ready_shipping_method:false,
		ready_payment_method:false,
		ready_discounts:false,
		ready_reviewed:false,
				
		initMessages: function(){
			$('.close-message-wrapper, .opc-messages-action .button').on('click',function(e){
				e.preventDefault();
				$('.opc-message-wrapper').hide();
				$('.opc-message-container').empty();
			});
		},
		
		popup_message: function(html_message,sizeObj){
			sizeObj = sizeObj || {width: 350,minHeight: 25,}
			if($("#mess").length<=0)$('body').append('<div id="mess">');
			$("#mess").html((typeof html_message === 'string' || html_message instanceof String)?html_message:html_message.html());
			
			$("#mess").prepend('<button style="float:right" id="ok" >Ok</button>');
			
			var defaultParams = {
				autoOpen: true,
				resizable: false,
				modal: true,
				draggable : false,
				create:function(){
					$('.ui-dialog-titlebar').remove();
					$(".ui-dialog-buttonpane").remove();
					$('body').css({overflow:"hidden"});
				},
				buttons:{
					Ok:function(){
						$( this ).dialog( "close" );
					}
				},
				open:function(){
					$( "#ok" ).on('click',function(e){
						e.preventDefault();
						$( "#mess" ).dialog( "close" );
					});
				},
				close: function() {
					$('body').css({overflow:"auto"});
					$( "#mess" ).dialog( "destroy" );
					$( "#mess" ).remove();
				}																										
			}
			defaultParams = jQuery.extend(defaultParams,sizeObj);
			$( "#mess" ).dialog(defaultParams);
		},
		ajaxManager: (function() {
			var requests = [];
			var requests_obj = {};
			 return {
				addReq:  function(action,opt) {
					if( $.inArray(action, requests) > -1 ){
						//not this assums that the first one is what we wnt to use
					}else{
						requests.push(action);
						requests_obj[action]=opt;
						console.log(requests);
						console.log(requests_obj);
					}
				},
				removeReq:  function(action,opt) {
					if( $.inArray(opt, requests) > -1 ){
						requests.splice($.inArray(action, requests), 1);
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
							 if( typeof(oriSuc) === 'function' ){
								 oriSuc();
							 }
							 requests.shift();
							 self.run.apply(self, []);
							 console.log(requests);
						};   
						$.ajaxSetup({ cache: false });
						$.ajax(post_obj);
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
			$(document).on('click', '.opc-btn-checkout', function(e){
				e.preventDefault();
				if (WSU.OPC.Checkout.disabledSave==true){
					return;
				}

				// check agreements
				var mis_aggree = false;
				$('#checkout-agreements input[name*="agreement"]').each(function(){
					if(!$(this).is(':checked')){
						mis_aggree = true;
					}
				});
				
				if(mis_aggree){
					$('.opc-message-container').html($('#agree_error').html());
					$('.opc-message-wrapper').show();
					WSU.OPC.Checkout.hideLoader();
					WSU.OPC.Checkout.unlockPlaceOrder();
					WSU.OPC.saveOrderStatus = false;
					return false;
				}
				///
				
				var addressForm = new VarienForm('opc-address-form-billing');
				if (!addressForm.validator.validate()){
					return;
				}
				
				if (!$('input[name="billing[use_for_shipping]"]').prop('checked')){
					var addressForm = new VarienForm('opc-address-form-shipping');
					if (!addressForm.validator.validate()){				
						return;
					}
				}
				
				// check if LIPP enabled
				if(typeof(WSU.LIPP) !== 'undefined' && WSU.LIPP !== undefined && WSU.LIPP !== '' && WSU.LIPP) {
					if(WSU.LIPP.lipp_enabled){
						var method = payment.currentMethod;
						if (method.indexOf('paypaluk_express')!==-1 || method.indexOf('paypal_express')!==-1){
							if (WSU.OPC.Checkout.config.comment!=="0"){
								WSU.OPC.saveCustomerComment();
							}
							WSU.LIPP.redirectPayment();
							return;
						}
					}			    	
				}

				WSU.OPC.saveOrderStatus = true;
				WSU.OPC.Plugin.dispatch('saveOrderBefore');
				if (WSU.OPC.Checkout.isVirtual===false){
					WSU.OPC.Checkout.lockPlaceOrder();
					WSU.OPC.Shipping.saveShippingMethod();
				}else{
					WSU.OPC.validatePayment();
				}
			});
			
		},
		
		
		
		/** INIT CHAGE PAYMENT METHOD **/
		initPayment: function(){
			WSU.OPC.removeNotAllowedPaymentMethods();
			WSU.OPC.bindChangePaymentFields();
			
			$(document).on('click', '#co-payment-form input[type="radio"]', function(event){
				WSU.OPC.removeNotAllowedPaymentMethods();
				WSU.OPC.validatePayment();
			});
		},
		
		/** remove not allowed payment method **/
		removeNotAllowedPaymentMethods: function(){
			// remove p_method_authorizenet_directpost
			var auth_dp_obj = $('#p_method_authorizenet_directpost');
			if( auth_dp_obj.length ) {
				if(auth_dp_obj.attr('checked')){
					auth_dp_obj.attr('checked', false);
				}
				auth_dp_obj.parent('dt').remove();
				$('#payment_form_authorizenet_directpost').parent('dd').remove();
				$('#directpost-iframe').remove();
				$('#co-directpost-form').remove();
			}
		},
		
		/** CHECK PAYMENT IF PAYMENT IF CHECKED AND ALL REQUIRED FIELD ARE FILLED PUSH TO SAVE **/
		validatePayment: function(){	
			
			// check all required fields not empty
			var is_empty = false;
			$('#co-payment-form .required-entry').each(function(){
				if($(this).val() === '' && $(this).css('display') !== 'none' && !$(this).attr('disabled')){
					is_empty = true;
				}
			});

			if(!WSU.OPC.saveOrderStatus){
				if(is_empty){
					WSU.OPC.saveOrderStatus = false;
					WSU.OPC.Checkout.hideLoader();
					WSU.OPC.Checkout.unlockPlaceOrder();				
					return false;
				}
			}

			var vp = payment.validate();
			if(!vp){
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();
				return false;
			}

			var paymentMethodForm = new Validation('co-payment-form', { onSubmit : false, stopOnFirst : false, focusOnError : false});
				
			if (paymentMethodForm.validate()){
				WSU.OPC.savePayment();
			}else{
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();
				
				WSU.OPC.bindChangePaymentFields();
			}
			
			
		},
		

		/** BIND CHANGE PAYMENT FIELDS **/ 
		bindChangePaymentFields: function(){
			WSU.OPC.unbindChangePaymentFields();
			
			$('#co-payment-form input').on('keyup',function(e){
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
			$('#co-payment-form select').on('change',function(e){
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
			$('#co-payment-form input').off('keyup');
			$('#co-payment-form select').off('change');
		},		
		
		/** SAVE PAYMENT **/		
		savePayment: function(){
			
			if (WSU.OPC.Checkout.xhr!=null){
				WSU.OPC.Checkout.xhr.abort();
			}
			
			WSU.OPC.Checkout.lockPlaceOrder();
			if (payment.currentMethod !== 'stripe') {
				var form = $('#co-payment-form').serializeArray();
				WSU.OPC.Checkout.showLoader('.payment-block',"<h1>Saving payment choice</h1>");
				WSU.OPC.ajaxManager.addReq("savePayment",{
				   type: 'POST',
				   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/savePayment',
				   dataType: 'json',
				   data: form,
				   success: WSU.OPC.preparePaymentResponse
			   });
			}else{
				Stripe.createToken({
					
					name: $('stripe_cc_owner').value,
					number: $('stripe_cc_number').value,
					cvc: $('stripe_cc_cvc').value,
					exp_month: $('stripe_cc_expiration_month').value,
					exp_year: $('stripe_cc_expiration_year').value
				}, function(status, response) {
					if (response.error) {
						WSU.OPC.Checkout.hideLoader();
						WSU.OPC.Checkout.xhr = null;
						WSU.OPC.Checkout.unlockPlaceOrder();
						alert(response.error.message);
					} else {
						$('stripe_token').value = response['id'];
						var form = $('#co-payment-form').serializeArray();
						WSU.OPC.Checkout.showLoader('.payment-block',"<h1>Saving payment choice</h1>");
						
						WSU.OPC.ajaxManager.addReq("savePayment",{
						   type: 'POST',
						   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/savePayment',
						   dataType: 'json',
						   data: form,
						   success: WSU.OPC.preparePaymentResponse
					   });
					}
				});
			}	
		},
		
		/** CHECK RESPONSE FROM AJAX AFTER SAVE PAYMENT METHOD **/
		preparePaymentResponse: function(response){
			WSU.OPC.Checkout.hideLoader('.payment-block');	
			WSU.OPC.Checkout.xhr = null;
			
			WSU.OPC.agreements = $('#checkout-agreements').serializeArray();
			if (typeof(response.review)!= "undefined" && WSU.OPC.saveOrderStatus===false){					
				$('#review-block').html(response.review);
				if($( "tr:contains('Free Shipping - Free')" ).length){
					$( "tr:contains('Free Shipping - Free')" ).hide();
				}
				WSU.OPC.Checkout.removePrice();
			}		
			WSU.OPC.getSubscribe();

			if (typeof(response.review)!=="undefined"){
				WSU.OPC.Decorator.updateGrandTotal(response);
				$('#opc-review-block').html(response.review);
				WSU.OPC.Checkout.removePrice();
				
				// need to recheck subscribe and agreenet checkboxes
				WSU.OPC.recheckItems();
			}

			if (typeof(response.error) !== "undefined"){
				WSU.OPC.Plugin.dispatch('error');
				WSU.OPC.popup_message(response.error);
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.ready_payment_method=false;
				return;
			}

			//SOME PAYMENT METHOD REDIRECT CUSTOMER TO PAYMENT GATEWAY
			WSU.OPC.ready_payment_method=true;
			if (typeof(response.redirect) !== "undefined" && WSU.OPC.saveOrderStatus===true){
				WSU.OPC.Checkout.xhr = null;
				WSU.OPC.Plugin.dispatch('redirectPayment', response.redirect);
				if (WSU.OPC.Checkout.xhr==null){
					setLocation(response.redirect);
				} else {
					WSU.OPC.Checkout.hideLoader();
					WSU.OPC.Checkout.unlockPlaceOrder();					
				}
				return;
			}
			
			if (WSU.OPC.saveOrderStatus===true){
				WSU.OPC.saveOrder();				
			} else {
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();				
			}
			
			WSU.OPC.Plugin.dispatch('savePaymentAfter');
		}, 
		
		/** SAVE ORDER **/
		saveOrder: function(){
			var form = $('#co-payment-form').serializeArray();
			form  = WSU.OPC.checkAgreement(form);
			form  = WSU.OPC.checkSubscribe(form);
			form  = WSU.OPC.getComment(form);
			
			WSU.OPC.Checkout.showLoader("#general_message","<h1>Processing order.</h1>");
			WSU.OPC.Checkout.lockPlaceOrder();				

			if (WSU.OPC.Checkout.config.comment!=="0"){
				WSU.OPC.saveCustomerComment();
				setTimeout(function(){
					WSU.OPC.callSaveOrder(form);				
				},600);
			}else{
				WSU.OPC.callSaveOrder(form);
			}
		},
	
		callSaveOrder: function(form){
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
			   data: {"comment": $('#customer_comment').val()},
			   success: function(){}
		   });
		}, 
		
		getComment: function(form){
			var com = $('#customer_comment').val();
			form.push({"name":"customer_comment", "value":com});
			return form;
		},
		
		/** ADD AGGREMENTS TO ORDER FORM **/
		checkAgreement: function(form){
			$.each(WSU.OPC.agreements, function(index, data){
				form.push(data);
			});
			return form;
		},
		
		/** ADD SUBSCRIBE TO ORDER FORM **/
		getSubscribe: function(){
			if ($('#is_subscribed').length){
				if ($('#is_subscribed').is(':checked')){
					WSU.OPC.is_subscribe = true;
				}else{
					WSU.OPC.is_subscribe = false;
				}
			}else{
				WSU.OPC.is_subscribe = false;
			}
		},
		
		checkSubscribe: function(form){
			if(WSU.OPC.is_subscribe){
				form.push({"name":"is_subscribed", "value":"1"});
			}else{
				form.push({"name":"is_subscribed", "value":"0"});
			}
			return form;
		},
		
		/** Check checkboxes after refreshing review section **/
		recheckItems: function(){
			// check subscribe
			if ($('#is_subscribed').length){
				if(WSU.OPC.is_subscribe)
					$('#is_subscribed').prop('checked', true);
				else
					$('#is_subscribed').prop('checked', false);
			}
			
			// check agree
			WSU.OPC.recheckAgree();
		},
		
		recheckAgree: function(){			
			if(WSU.OPC.agreements !== null){
				$.each(WSU.OPC.agreements, function(index, data){
					$('#checkout-agreements input').each(function(){
						if(data.name === $(this).prop('name'))
							$(this).prop('checked', true);
					});
				});
			}
		},
		
		/** CHECK RESPONSE FROM AJAX AFTER SAVE ORDER **/
		prepareOrderResponse: function(response){
			WSU.OPC.Checkout.xhr = null;
			if (typeof(response.error) !== "undefined" && response.error!==false){
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();				
				
				WSU.OPC.saveOrderStatus = false;
				$('.opc-message-container').html(response.error);
				$('.opc-message-wrapper').show();
				WSU.OPC.Plugin.dispatch('error');
				return;
			}
			
			if (typeof(response.error_messages) !== "undefined" && response.error_messages!==false){
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();				
				
				WSU.OPC.saveOrderStatus = false;
				$('.opc-message-container').html(response.error_messages);
				$('.opc-message-wrapper').show();
				WSU.OPC.Plugin.dispatch('error');
				return;
			}
			
		
			if (typeof(response.redirect) !== "undefined"){
				if (response.redirect!==false){
					setLocation(response.redirect);
					return;
				}
			}
			
			if (typeof(response.update_section) !== "undefined"){
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();				
				
				//create catch for default logic  - for not spam errors to console
				try{
					$('#checkout-' + response.update_section.name + '-load').html(response.update_section.html);
				}catch(e){
					
				}
				
				WSU.OPC.prepareExtendPaymentForm();
				$('#payflow-advanced-iframe').show();
				$('#payflow-link-iframe').show();
				$('#hss-iframe').show();
				
			}
			WSU.OPC.Checkout.hideLoader();
			WSU.OPC.Checkout.unlockPlaceOrder();				
			
			WSU.OPC.Plugin.dispatch('responseSaveOrder', response);
		},
	};
	
	
	
	WSU.OPC.Checkout = {
		config:null,
		ajaxProgress:false,
		xhr: null,
		isVirtual: false,
		disabledSave: false,
		saveOrderUrl: null,
		xhr2: null,
		updateShippingPaymentProgress: false,

	
		showLoader: function(parentBlock,message){
			var jObj = parentBlock!=="undefined" ? parentBlock:"#general_message";
			var html = message!=="undefined" ? message:"";
			if($(jObj+' .opc-ajax-loader .loader .message').length<=0){
				$(jObj+' .opc-ajax-loader .loader').append("<div class='message'>"+html+"</div>");
			}else{
				$(jObj+' .opc-ajax-loader .loader .message').html(html);
			}
			$(jObj+' .opc-ajax-loader').show();
			$('.opc-btn-checkout').attr("disabled",true);
			//console.log("masking "+jObj+" with a message of "+html);
		},
		
		hideLoader: function(parentBlock){
			var jObj = parentBlock!=="undefined"? parentBlock:"#general_message";
			$(jObj+' .opc-ajax-loader').hide();
			$(jObj+' .opc-ajax-loader .loader .message').remove();
			$('.opc-btn-checkout').removeAttr("disabled");
			//console.log("hidgin mask of "+jObj+" with a message of ");
		},
		
		/*showLoader: function(){
			$('.opc-ajax-loader').show();
			//$('.opc-btn-checkout').addClass('button-disabled');
		},
		
		hideLoader: function(){
			setTimeout(function(){
				$('.opc-ajax-loader').hide();
				//$('.opc-btn-checkout').removeClass('button-disabled');				
			},600);
		},*/

		init:function(){		
			
			if (this.config==null){
				return;
			}
			WSU.OPC.ajaxManager.run(); 
			//base config
			this.config = $.parseJSON(this.config);
			
			WSU.OPC.Checkout.saveOrderUrl = WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveOrder',
			this.success = WSU.OPC.Checkout.config.baseUrl + 'checkout/onepage/success',
			
			//DECORATE
			this.clearOnChange();
			this.removePrice();			
			
			//MAIN FUNCTION
			WSU.OPC.Billing.init();
			WSU.OPC.Shipping.init();	
			WSU.OPC.initMessages();
			WSU.OPC.initSaveOrder();
			
			$('#co-payment-form input[type="radio"]:checked').closest('dt').addClass('active');
			if (this.config.isLoggedIn===1){
				var addressId = $('#billing-address-select').val();
				if (addressId!=='' && addressId!=undefined ){
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
			console.log(response);
			WSU.OPC.Checkout.hideLoader("#opc-address-form-billing");
			WSU.OPC.Checkout.hideLoader("#opc-address-form-shipping");
			//WSU.OPC.Checkout.xhr = null;
			
			if (typeof(response.error) !== "undefined"){
				WSU.OPC.popup_message(response.message);
				WSU.OPC.Checkout.unlockPlaceOrder();
				return;
			}
			
			if(typeof(response.exists) != "undefined" && response.exists===true){
				if($("#existing").length<=0){
					$('#opc-address-form-billing .form-list').before('<b id="existing">This email exists.  Try loging in above</b>');
				}
				$("#existing").removeClass('unhighlight');
				$("#existing").addClass("highlight");
				setTimeout(function(){
					$("#existing").addClass('unhighlight');
					$("#existing").removeClass('highlight');
				}, 900);
			}
			
			
			/* WSU ADDRESS VALIDATION  */
			if (typeof(response.address_validation) !== "undefined"){
				$('#checkout-address-validation-load').empty().html(response.address_validation);
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();
				return;
			}
			
			if (typeof(response.shipping) !== "undefined"){
				$('#shipping-block-methods').empty().html(response.shipping);
			}
			
			if (typeof(response.payments) !== "undefined"){
				$('#checkout-payment-method-load').empty().html(response.payments);
				
				WSU.OPC.removeNotAllowedPaymentMethods();
				payment.initWhatIsCvvListeners();//default logic for view "what is this?"
			}
			
			if (typeof(response.isVirtual) !== "undefined"){
				WSU.OPC.Checkout.isVirtual = true;
			}
			
			if (WSU.OPC.Checkout.isVirtual === false){
				var update_payments = false;
				if (typeof(response.reload_payments) !== "undefined"){
					update_payments = true;
				}
				
				var reload_totals = false;
				if (typeof(response.reload_totals) !== "undefined"){
					reload_totals = true;
				}
				
				WSU.OPC.Shipping.saveShippingMethod(update_payments, reload_totals);
				
			}else{
				$('.shipping-block').hide();
				$('.payment-block').addClass('clear-margin');
				WSU.OPC.Checkout.pullPayments();
			}
		},
		
		/** PARSE RESPONSE FROM AJAX SAVE SHIPPING METHOD **/
		prepareShippingMethodResponse: function(response){
			WSU.OPC.Checkout.xhr = null;
			WSU.OPC.Checkout.hideLoader(".shipping-method-block");
			if (typeof(response.error) !== "undefined"){
				WSU.OPC.Checkout.unlockPlaceOrder();
				WSU.OPC.Plugin.dispatch('error');
				WSU.OPC.popup_message(response.message);
				WSU.OPC.saveOrderStatus = false;
				return;
			}
			
			if (typeof(response.review)!=="undefined" && WSU.OPC.saveOrderStatus===false){
				try{
					WSU.OPC.Decorator.updateGrandTotal(response);
					$('#opc-review-block').html(response.review);
				}catch(e){ }
				WSU.OPC.Checkout.removePrice();					
//				WSU.OPC.recheckAgree();
			}

			//IF STATUS TRUE - START SAVE PAYMENT FOR CREATE ORDER
			if (WSU.OPC.saveOrderStatus==true){
				WSU.OPC.validatePayment();
			}else{
				WSU.OPC.Checkout.pullPayments();
			}
		},
		
		
		clearOnChange: function(){
			$('.opc-col-left input, .opc-col-left select').removeAttr('onclick').removeAttr('onchange');
		},
		
		removePrice: function(){
			
			$('.opc-data-table tr th:nth-child(2)').remove();
			$('.opc-data-table tbody tr td:nth-child(2)').remove();
			$('.opc-data-table tfoot td').each(function(){
				var colspan = $(this).attr('colspan');
				
				if (colspan!=="" && colspan !=undefined){
					colspan = parseInt(colspan) - 1;
					$(this).attr('colspan', colspan);
				}
			});
			
			$('.opc-data-table tfoot th').each(function(){
				var colspan = $(this).attr('colspan');
				
				if (colspan!=="" && colspan !=undefined){
					colspan = parseInt(colspan) - 1;
					$(this).attr('colspan', colspan);
				}
			});
			
		},

		
		/** APPLY SHIPPING METHOD FORM TO BILLING FORM **/
		applyShippingMethod: function(form){
			formShippimgMethods = $('#opc-co-shipping-method-form').serializeArray();
			$.each(formShippimgMethods, function(index, data){
				form.push(data);
			});
			
			return form;
		},
		
		/** APPLY NEWSLETTER TO BILLING FORM **/
		applySubscribed: function(form){
			if ($('#is_subscribed').length){
				if ($('#is_subscribed').is(':checked')){
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
						$('#review-block').html(response.review);
						WSU.OPC.Checkout.removePrice();
					}
					if($( "tr:contains('Free Shipping - Free')" ).length){
						$( "tr:contains('Free Shipping - Free')" ).hide();
					}
					WSU.OPC.Checkout.unlockPlaceOrder();
					if (typeof(response.review)!=="undefined"){
						WSU.OPC.Decorator.updateGrandTotal(response);
						$('#opc-review-block').html(response.review);
						
						WSU.OPC.Checkout.removePrice();
						
	//					WSU.OPC.recheckAgree();
					}
					WSU.OPC.removeNotAllowedPaymentMethods();
				}
		   });
			
			
			
			
		},
		
		/** PULL PAYMENTS METHOD AFTER LOAD PAGE **/
		pullPayments: function(){
			/*WSU.OPC.Checkout.lockPlaceOrder();
			WSU.OPC.Checkout.xhr = $.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/json/payments',function(response){
				WSU.OPC.Checkout.xhr = null;
				
				if (typeof(response.error)!=="undefined"){
					$('.opc-message-container').html(response.error);
					$('.opc-message-wrapper').show();
					WSU.OPC.saveOrderStatus = false;
					WSU.OPC.Checkout.hideLoader();
					WSU.OPC.Checkout.unlockPlaceOrder();					
					return;
				}
				
				if (typeof(response.payments)!=="undefined"){
					$('#checkout-payment-method-load').html(response.payments);
					
					payment.initWhatIsCvvListeners();
					WSU.OPC.bindChangePaymentFields();
					WSU.OPC.Decorator.setCurrentPaymentActive();
				};
				
				WSU.OPC.Checkout.pullReview();
				
			},'json');*/
			
			WSU.OPC.Checkout.lockPlaceOrder();
			WSU.OPC.Checkout.showLoader('.payment-block',"<h1>Getting payment choices</h1>");
			
			WSU.OPC.ajaxManager.addReq("savePayments",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/payments',
			   dataType: 'json',
			   success:function(response){
					/*WSU.OPC.Checkout.hideLoader('.payment-block');
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
					WSU.OPC.Checkout.pullReview();*/
					
					
					WSU.OPC.Checkout.hideLoader('.payment-block');	
					if (typeof(response.error)!=="undefined"){
						WSU.OPC.popup_message(response.error);
						WSU.OPC.saveOrderStatus = false;
						WSU.OPC.Checkout.hideLoader();
						WSU.OPC.Checkout.unlockPlaceOrder();					
						return;
					}
					
					if (typeof(response.payments)!=="undefined"){
						$('#checkout-payment-method-load').html(response.payments);
						payment.initWhatIsCvvListeners();
						WSU.OPC.bindChangePaymentFields();
						WSU.OPC.Decorator.setCurrentPaymentActive();
					};
					
					WSU.OPC.Checkout.pullReview();
					if(typeof(callback) !== "undefined" && $.isFunction(callback)){
						callback();
					}
				}
		   });

		},
		
		lockPlaceOrder: function(mode){
			if(typeof(mode) === 'undefined' || mode === undefined || !mode){
				mode = 0;
			}
			if(mode === 0){
				$('.opc-btn-checkout').addClass('button-disabled');
			}
			WSU.OPC.Checkout.disabledSave = true;
		},
		
		unlockPlaceOrder: function(){
			$('.opc-btn-checkout').removeClass('button-disabled');
			WSU.OPC.Checkout.disabledSave = false;
		},
	
		abortAjax: function(){
			if (WSU.OPC.Checkout.xhr!=null){
				WSU.OPC.Checkout.xhr.abort();
				
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();
			}
		},
		
		reloadShippingsPayments: function(form_type, delay){
			/*if(typeof(delay) === 'undefined' || delay === undefined || !delay){
				delay = 1400;
			}
			
			clearTimeout(WSU.OPC.Checkout.updateShippingPaymentProgress);
			
			WSU.OPC.Checkout.updateShippingPaymentProgress = setTimeout(function(){
				
				var form = $('#opc-address-form-'+form_type).serializeArray();
				form = WSU.OPC.Checkout.applyShippingMethod(form);
				
				if (WSU.OPC.Checkout.xhr2!=null){
					WSU.OPC.Checkout.xhr2.abort();
				}
				
				WSU.OPC.Checkout.xhr2 = $.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/json/reloadShippingsPayments',form, WSU.OPC.Checkout.reloadShippingsPaymentsResponse,'json');
				
			}, delay);
			
			 */
			
			WSU.OPC.Checkout.showLoader('.payment-block',"<h1>Getting payment choices</h1>");
			WSU.OPC.ajaxManager.addReq("savePayments",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/reloadShippingsPayments',
			   dataType: 'json',
			   success: WSU.OPC.Checkout.reloadShippingsPaymentsResponse
		   });
			
		},
		
		reloadShippingsPaymentsResponse: function(response){
			
			WSU.OPC.Checkout.xhr2 = null;
			
			if (typeof(response.error) !== "undefined"){
				$('.opc-message-container').html(response.message);
				$('.opc-message-wrapper').show();
				WSU.OPC.Checkout.hideLoader();
				WSU.OPC.Checkout.unlockPlaceOrder();
				return;
			}
			
			if (typeof(response.shipping) !== "undefined"){
				$('#shipping-block-methods').empty().html(response.shipping);
			}
			
			if (typeof(response.payments) !== "undefined"){
				
				if(response.payments !== ''){
					$('#checkout-payment-method-load').empty().html(response.payments);

					WSU.OPC.removeNotAllowedPaymentMethods();
					payment.initWhatIsCvvListeners();//default logic for view "what is this?"
				}

				if (WSU.OPC.Checkout.isVirtual===false){
					var update_payments = false;
					if (typeof(response.reload_payments) !== "undefined"){
						update_payments = true;
					}

					WSU.OPC.Shipping.saveShippingMethod(update_payments);
				}else{
					$('.shipping-block').hide();
					$('.payment-block').addClass('clear-margin');
					WSU.OPC.Checkout.pullPayments();
				}
			}
			else{
				if(typeof(response.reload_totals) !== "undefined"){
					WSU.OPC.Checkout.pullReview();
				}
			}
		},
		
		checkRunReloadShippingsPayments: function(address_type){
			var zip = $('#'+address_type+':postcode').val();
			var country = $('#'+address_type+':country_id').val();
			var region = $('#'+address_type+':region_id').val();
			
			if(zip !== '' || country !== '' || region !== ''){
				WSU.OPC.Checkout.reloadShippingsPayments(address_type);
			}
		}
	};
	
	
	WSU.OPC.Billing = {
		bill_need_update: true,
		need_reload_shippings_payments: false,
		validate_timeout: false,
		
		init: function(){
			WSU.OPC.Billing.bill_need_update = true;

			//set flag use billing for shipping and init change flag
			var use_for_ship = false;
			var el = $('input[name="billing[use_for_shipping]"]');
			if(typeof(el) !== 'undefined' && el !== undefined && el){
				if(el.prop('type') === 'checkbox'){
					if(el.is(':checked')){
						use_for_ship = true;
					}
				}else{
					use_for_ship = true;
				}
			}else{
				use_for_ship = true;
			}

			if(use_for_ship){
				this.setBillingForShipping(true);
			}else{
				this.setBillingForShipping(false, true);
			}
			
			$('input[name="billing[use_for_shipping]"]').change(function(){
				if ($(this).is(':checked')){
					WSU.OPC.Billing.setBillingForShipping(true);
					$('#opc-address-form-billing select[name="billing[country_id]"]').change();
					WSU.OPC.Billing.need_reload_shippings_payments = 'billing';
					WSU.OPC.Billing.validateForm();
				}else{
					WSU.OPC.Billing.setBillingForShipping(false);
					WSU.OPC.Billing.need_reload_shippings_payments = 'shipping';
					WSU.OPC.Shipping.validateForm();
				}
			});
			
			
			//update password field
			$('input[name="billing[create_account]"]').on('click',function(e){
				e.preventDefault();
				if ($(this).is(':checked')){
					$('#register-customer-password').removeClass('hidden');
					$('input[name="billing[customer_password]"]').addClass('required-entry');
					$('input[name="billing[confirm_password]"]').addClass('required-entry');
				}else{
					$('#register-customer-password').addClass('hidden');
					$('input[name="billing[customer_password]"]').removeClass('required-entry');
					$('input[name="billing[confirm_password]"]').removeClass('required-entry');
					$('#register-customer-password input').val('');
				}
			});
			
			this.initChangeAddress();
			this.initChangeSelectAddress();
		},
		
		/** CREATE EVENT FOR UPDATE SHIPPING BLOCK **/
		initChangeAddress: function(){

			$('#opc-address-form-billing input').blur(function(){
				if(WSU.OPC.Billing.bill_need_update){
					WSU.OPC.Billing.validateForm();
				}
			});

			$('#opc-address-form-billing').mouseleave(function(){
				if(WSU.OPC.Billing.bill_need_update){
					WSU.OPC.Billing.validateForm();
				}
			});
			
			$('#opc-address-form-billing input').keydown(function(){
				WSU.OPC.Billing.bill_need_update = true;
				clearTimeout(WSU.OPC.Checkout.ajaxProgress);
				WSU.OPC.Checkout.abortAjax();
				
				// check if zip
				var el_id = $(this).attr('id');
				if(el_id === 'billing:postcode'){
					WSU.OPC.Checkout.reloadShippingsPayments('billing');
				}

				WSU.OPC.Billing.validateForm(3000);
			});
			
			$('#opc-address-form-billing select').not('#billing-address-select').change(function(){
				// check if country
				var el_id = $(this).attr('id');
				if(el_id === 'billing:country_id' || el_id === 'billing:region_id'){
					WSU.OPC.Checkout.reloadShippingsPayments('billing', 800);
				}
				
				WSU.OPC.Billing.bill_need_update = true;
				WSU.OPC.Billing.validateForm();
			});			
		},
		
		validateForm: function(delay){
			clearTimeout(WSU.OPC.Billing.validate_timeout);
			if(typeof(delay) === 'undefined' || delay === undefined || !delay){
				delay = 100;
			}
			
			WSU.OPC.Billing.validate_timeout = setTimeout(function(){
				var mode = WSU.OPC.Billing.need_reload_shippings_payment;
				WSU.OPC.Billing.need_reload_shippings_payment = false;

				var valid = WSU.OPC.Billing.validateAddressForm();
				if (valid){
					WSU.OPC.Billing.save();
				}else{
					if(mode !== false){
						WSU.OPC.Checkout.checkRunReloadShippingsPayments(mode);
					}
				}
			},delay);
		},
		
		
		/** CREATE EVENT FOR CHANGE ADDRESS TO NEW OR FROM ADDRESS BOOK **/
		initChangeSelectAddress: function(){
			$('#billing-address-select').change(function(){
				if ($(this).val()==''){
					$('#billing-new-address-form').show();
				}else{
					$('#billing-new-address-form').hide();
					WSU.OPC.Billing.validateForm();
				}
			});
			
			
		},
		
		/** VALIDATE ADDRESS BEFORE SEND TO SAVE QUOTE**/
		validateAddressForm: function(form){
			// check all required fields not empty
			var is_empty = false;
			$('#opc-address-form-billing .required-entry').each(function(){
				if($(this).val() === '' && $(this).css('display') !== 'none' && !$(this).attr('disabled')){
					is_empty = true;
				}
			});
			if(is_empty){
				return false;
			}

			var addressForm = new Validation('opc-address-form-billing', { onSubmit : false, stopOnFirst : false, focusOnError : false});
			if (addressForm.validate()){				  		 
				return true;
			}else{				 
				return false;
			}
		},
		
		/** SET SHIPPING AS BILLING TO TRUE OR FALSE **/
		setBillingForShipping:function(useBilling, skip_copy){
			if (useBilling==true){
				$('input[name="billing[use_for_shipping]"]').prop('checked', true);
				$('input[name="shipping[same_as_billing]"]').prop('checked', true);
				$('#opc-address-form-shipping').addClass('hidden');				
			}else{
				if(typeof(skip_copy) === 'undefined' || skip_copy === undefined){
					skip_copy = false;
				}
				if(!skip_copy){
					this.pushBilingToShipping();
				}
				$('input[name="billing[use_for_shipping]"]').prop('checked', false);
				$('input[name="shipping[same_as_billing]"]').prop('checked', false);
				$('#opc-address-form-shipping').removeClass('hidden');
			}
			
		}, 
		
		/** COPY FIELD FROM BILLING FORM TO SHIPPING **/
		pushBilingToShipping:function(clearShippingForm){
			//pull country
			var valueCountry = $('#billing-new-address-form select[name="billing[country_id]"]').val();
			$('#opc-address-form-shipping  select[name="shipping[country_id]"] [value="' + valueCountry + '"]').prop("selected", true);	
			shippingRegionUpdater.update();
			
			
			//pull region id
			var valueRegionId = $('#billing-new-address-form select[name="billing[region_id]"]').val();
			$('#opc-address-form-shipping  select[name="shipping[region_id]"] [value="' + valueRegionId + '"]').prop("selected", true);
			
			//pull other fields	
			$('#billing-new-address-form input').not(':hidden, :input[type="checkbox"]').each(function(){
				var name = $(this).attr('name');
				var value = $(this).val();
				var shippingName =  name.replace( /billing/ , 'shipping');
				
				$('#opc-address-form-shipping input[name="'+shippingName+'"]').val(value);

			});
			
			//pull address field
			$('#billing-new-address-form input[name="billing[street][]"]').each(function(indexBilling){
				var valueAddress = $(this).val();
				$('#opc-address-form-shipping input[name="shipping[street][]"]').each(function(indexShipping){
					if (indexBilling==indexShipping){
						$(this).val(valueAddress);
					}
				});				
			});
			
			//init trigger change shipping form
			$('#opc-address-form-shipping select[name="shipping[country_id]"]').change();
		},

		/** METHOD CREATE AJAX REQUEST FOR UPDATE BILLING ADDRESS
		save: function(){
			if (WSU.OPC.Checkout.ajaxProgress!==false){
				clearTimeout(WSU.OPC.Checkout.ajaxProgress);
			}

			// stop reload shippings/payments logic
			if (WSU.OPC.Checkout.updateShippingPaymentProgress!==false){
				clearTimeout(WSU.OPC.Checkout.updateShippingPaymentProgress);
			}
			
			if (WSU.OPC.Checkout.xhr2!=null){
				WSU.OPC.Checkout.xhr2.abort();
			}
			////
			
			WSU.OPC.Checkout.ajaxProgress = setTimeout(function(){
					var form = $('#opc-address-form-billing').serializeArray();
					form = WSU.OPC.Checkout.applyShippingMethod(form);					
					form = WSU.OPC.Checkout.applySubscribed(form); 
					
					if (WSU.OPC.Checkout.xhr!=null){
						WSU.OPC.Checkout.xhr.abort();
					}
					
					if($('input[name="billing[use_for_shipping]"]').is(':checked'))
						WSU.OPC.Checkout.showLoader();
					else
						WSU.OPC.Checkout.lockPlaceOrder(1);
					
					WSU.OPC.Billing.bill_need_update = false;		
					WSU.OPC.Checkout.xhr = $.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveBilling',form, WSU.OPC.Checkout.prepareAddressResponse,'json');
			}, 500);
		}, **/
		
		
		save: function(){
			
			var form = $('#opc-address-form-billing').serializeArray();
			form = WSU.OPC.Checkout.applyShippingMethod(form);		 			
			form = WSU.OPC.Checkout.applySubscribed(form); 
			form.push({ "name":"billing[use_for_shipping]", "value": jQuery('[name*=use_for_shipping]:checked').length });
			if($('input[name="billing[use_for_shipping]"]').is(':checked')){
				WSU.OPC.Checkout.showLoader();
			}else{
				WSU.OPC.Checkout.lockPlaceOrder(1);
			}
			
			WSU.OPC.Billing.bill_need_update = false;		
			WSU.OPC.Checkout.showLoader("#opc-address-form-billing","<h1>Saving billing information</h1>");
			WSU.OPC.ajaxManager.addReq("saveBilling",{
			   type: 'POST',
			   url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveBilling',
			   dataType: 'json',
			   data: form,
			   success: WSU.OPC.Checkout.prepareAddressResponse
		   });
		}
	};
	
	WSU.OPC.Shipping = {
		ship_need_update: true,
		validate_timeout: false,
		
		init: function(){
			WSU.OPC.Shipping.ship_need_update = true;
			this.initChangeAddress();
			this.initChangeSelectAddress();
			this.initChangeShippingMethod();
		},

		/** CREATE EVENT FOR UPDATE SHIPPING BLOCK **/
		initChangeAddress: function(){
			
			$('#opc-address-form-shipping input').blur(function(){
				if(WSU.OPC.Shipping.ship_need_update){
					WSU.OPC.Shipping.validateForm();
				}
			});

			$('#opc-address-form-shipping').mouseleave(function(){
				if(WSU.OPC.Shipping.ship_need_update)
					WSU.OPC.Shipping.validateForm();
			});
			
			$('#opc-address-form-shipping input').keydown(function(){
				WSU.OPC.Shipping.ship_need_update = true;
				clearTimeout(WSU.OPC.Checkout.ajaxProgress);
				WSU.OPC.Checkout.abortAjax();

				// check if zip
				var el_id = $(this).attr('id');
				if(el_id === 'shipping:postcode'){
					WSU.OPC.Checkout.reloadShippingsPayments('shipping');
				}

				WSU.OPC.Shipping.validateForm(3000);
				
			});
			
			$('#opc-address-form-shipping select').not('#shipping-address-select').change(function(){
				// check if country
				var el_id = $(this).attr('id');
				if(el_id === 'shipping:country_id' || el_id === 'shipping:region_id'){
					WSU.OPC.Checkout.reloadShippingsPayments('shipping', 800);
				}
				
				WSU.OPC.Shipping.ship_need_update = true;
				WSU.OPC.Shipping.validateForm();
			});
		},
		
		/** CREATE VENT FOR CHANGE ADDRESS TO NEW OR FROM ADDRESS BOOK **/
		initChangeSelectAddress: function(){
			$('#shipping-address-select').change(function(){
				if ($(this).val()==''){
					$('#shipping-new-address-form').show();
				}else{
					$('#shipping-new-address-form').hide();
					WSU.OPC.Shipping.validateForm();
				}
			});
			
			
		},
		
		//create observer for change shipping method. 
		initChangeShippingMethod: function(){
			$('.opc-wrapper-opc #shipping-block-methods').on('change', 'input[type="radio"]', function(){
				WSU.OPC.Shipping.saveShippingMethod();
			});
		},
		
		validateForm: function(delay){
			clearTimeout(WSU.OPC.Shipping.validate_timeout);
			if(typeof(delay) === 'undefined' || delay === undefined || !delay){
				delay = 100;
			}
			
			WSU.OPC.Shipping.validate_timeout = setTimeout(function(){
				var mode = WSU.OPC.Billing.need_reload_shippings_payment;
				WSU.OPC.Billing.need_reload_shippings_payment = false;

				var valid = WSU.OPC.Shipping.validateAddressForm();
				if (valid){
					WSU.OPC.Shipping.save();
				}
				else{
					if(mode !== false){
						WSU.OPC.Checkout.checkRunReloadShippingsPayments(mode);
					}
				}
			},delay);
		},
		
		/** VALIDATE ADDRESS BEFORE SEND TO SAVE QUOTE**/
		validateAddressForm: function(form){
			// check all required fields not empty
			var is_empty = false;
			$('#opc-address-form-shipping .required-entry').each(function(){
				if($(this).val() === '' && $(this).css('display') !== 'none' && !$(this).attr('disabled'))
					is_empty = true;
			});
			
			if(is_empty){
				return false;
			}
			
			var addressForm = new Validation('opc-address-form-shipping', { onSubmit : false, stopOnFirst : false, focusOnError : false});
			if (addressForm.validate()){				  		 
				return true;
			}else{				 
				return false;
			}
		},
		
		/** METHOD CREATE AJAX REQUEST FOR UPDATE SHIPPIN METHOD **/
		save: function(){
			var form = $('#opc-address-form-shipping').serializeArray();
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
		
		saveShippingMethod: function(update_payments, reload_totals){
			if (WSU.OPC.Shipping.validateShippingMethod()===false){
				if (WSU.OPC.saveOrderStatus){
					WSU.OPC.popup_message($('#pssm_msg').html());
				}
				WSU.OPC.saveOrderStatus = false;
				WSU.OPC.Checkout.hideLoader();
				if(typeof(update_payments) !== 'undefined' && update_payments !== undefined && update_payments){
					// if was request to reload payments
					WSU.OPC.Checkout.pullPayments();
				}else{
					if(typeof(reload_totals) === 'undefined' || reload_totals === undefined){
						reload_totals = false;
					}
					if(reload_totals){
						WSU.OPC.Checkout.pullReview();
					}else{
						WSU.OPC.Checkout.unlockPlaceOrder();
					}
				}
				return;
			}

			if (WSU.OPC.Shipping.validateShippingMethod()===false){
				WSU.OPC.popup_message('Please specify shipping method');
				WSU.OPC.Checkout.hideLoader();
				return;
			}
			
			var form = $('#opc-co-shipping-method-form').serializeArray();
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
			$('#opc-co-shipping-method-form input').each(function(){				
				if ($(this).prop('checked')){							
					shippingChecked =  true;
				}
			});
			
			return shippingChecked;
		}		
	};
	
	
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
				//WSU.OPC.Checkout.pullPayments();
				WSU.OPC.Checkout.pullReview();
			}
			if (typeof(response.coupon) !== "undefined" && response.coupon!==""){
				$('#opc-discount-coupon-form').replaceWith(response.coupon).show();				
				$('#opc-discount-coupon-form').show();
				//$('.discount-block').html(response.coupon);
			}
			if (typeof(response.payments)!=="undefined"){
				$('#checkout-payment-method-load').html(response.payments);
				
				WSU.OPC.removeNotAllowedPaymentMethods();
				
				payment.initWhatIsCvvListeners();
				WSU.OPC.bindChangePaymentFields();
			};	
			WSU.OPC.Coupon.init();	
		}
	};
	
	WSU.OPC.Comment = {
		init: function(){
			
			$(document).on('click','.comment-block h3', function(){
				if ($(this).hasClass('open-block')){
					$(this).removeClass('open-block');
					$(this).next().addClass('hidden');
				}else{
					$(this).addClass('open-block');					
					$(this).next().removeClass('hidden');
				}
			});
		}
	};
				
	WSU.OPC.SignatureAtCheckout = {
		init: function(){
			$(document).on('click','.signature-block h3', function(){
				if ($(this).hasClass('open-block')){
					$(this).removeClass('open-block');
					$(this).next().addClass('hidden');
				}else{
					$(this).addClass('open-block');
					$(this).next().removeClass('hidden');
				}
			});
		}
	};
	
	WSU.OPC.Agreement ={
		init: function(){
			
			$(document).on('click', '.view-agreement', function(e){
				e.preventDefault();
				$('.opc-review-actions #modal-agreement').addClass('md-show');
				
				var id = $(this).data('id');
				var title = $(this).html();
				var content = $('.opc-review-actions #agreement-block-'+id).html();
				
				$('.opc-review-actions #agreement-title').html(title);
				$('.opc-review-actions #agreement-modal-body').html(content);
			});
			
			$(document).on('click', '#checkout-agreements input[name*="agreement"]', function(){
				var cur_el = $(this);
				$('#checkout-agreements input').each(function(){
					
					if(cur_el.prop('name') === $(this).prop('name')){
						$(this).prop('checked', cur_el.prop('checked'));
					}
				});
				
				// save agreements statuses
				WSU.OPC.agreements = $('#checkout-agreements').serializeArray();
			});
		}
	};
	
	WSU.OPC.Login ={
		init: function(){
			$('.login-trigger').click(function(e){
				e.preventDefault();
				$('#modal-login').addClass('md-show');
			});
			
			$(document).on('click','.md-modal .close', function(e){
				e.preventDefault();
				$('.md-modal').removeClass('md-show');
			});
			
			$(document).on('click', '.restore-account', function(e){
				e.preventDefault();
				$('#login-form').hide();$('#login-button-set').hide();
				$('#form-validate-email').fadeIn();$('#forgotpassword-button-set').show();
			});
			
			
			$('#login-button-set .btn').on('click',function(e){
				e.preventDefault();
				$('#login-form').submit();
			});
			
			$('#forgotpassword-button-set .btn').on('click',function(e){
				e.preventDefault();
				var form = $('#form-validate-email').serializeArray();
				WSU.OPC.Checkout.showLoader();
				WSU.OPC.Checkout.xhr = $.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/json/forgotpassword',form, WSU.OPC.Login.prepareResponse,'json');
			});
			
			
			$('#forgotpassword-button-set .back-link').click(function(e){
				e.preventDefault();
				$('#form-validate-email').hide();$('#forgotpassword-button-set').hide();
				$('#login-form').fadeIn();$('#login-button-set').show();
				
			});
			
		},
		
		prepareResponse: function(response){
			WSU.OPC.Checkout.xhr = null;
			WSU.OPC.Checkout.hideLoader();
			if (typeof(response.error)!=="undefined"){
				alert(response.message);
			}else{
				alert(response.message);
				$('#forgotpassword-button-set .back-link').click();
			}
		}
	};
	
	WSU.OPC.Decorator = {
		initReviewBlock: function(){
			$('a.review-total').on('click',function(e){
				e.preventDefault();
				if ($(this).hasClass('open')){
					$(this).removeClass('open')
					$('#opc-review-block').addClass('hidden');
				}else{
					$(this).addClass('open')
					$('#opc-review-block').removeClass('hidden');
				}
			});
		},
		updateGrandTotal: function(response){
			$('.opc-review-actions h5 span').html(response.grandTotal);
			$('.review-total span').html(response.grandTotal);
		},
		
		setActivePayment: function(){
			//check and setup current active method 
			this.setCurrentPaymentActive();
			
			$(document).on('click','#checkout-payment-method-load dt', function(){
				$('#checkout-payment-method-load dt').removeClass('active');
				$(this).addClass('active');
			});
		},
		
		setCurrentPaymentActive: function(){
			var method = payment.currentMethod;
			$('#p_method_'+method).parent().addClass('active');
		}
	};
	
	$(document).ready(function(){
		WSU.OPC.Checkout.init();
		WSU.OPC.Coupon.init();
		WSU.OPC.Comment.init();
		WSU.OPC.Agreement.init();
		WSU.OPC.Login.init();
		WSU.OPC.Decorator.initReviewBlock();
		WSU.OPC.Decorator.setActivePayment();
	});
})(jQuery,jQuery.WSU);