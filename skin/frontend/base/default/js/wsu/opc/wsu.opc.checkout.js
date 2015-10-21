(function($,WSU){
	WSU.OPC.Checkout = {
		config:null,
		ajaxProgress:false,
		xhr: null,
		isVirtual: false,
		disabledSave: false,
		saveOrderUrl: null,
		xhr2: null,
		updateShippingPaymentProgress: false,

		createLoader: function(parentBlock,message){
			var jObj = parentBlock!=="undefined" ? parentBlock:"#general_message";
			if($(jObj+' .opc-ajax-loader').length<=0){
				$(jObj).append("<div class='opc-ajax-loader'></div>");
			}
			if($(jObj+' .opc-ajax-loader .loader').length<=0){
				$(jObj+' .opc-ajax-loader').append("<div class='loader'></div>");
			}
			if($(jObj+' .opc-ajax-loader .loader .message').length<=0){
				$(jObj+' .opc-ajax-loader .loader').append("<div class='message'></div>");
			}
		},	
		showLoader: function(parentBlock,message){
			var jObj = parentBlock!=="undefined" ? parentBlock:"#general_message";
			var html = message!=="undefined" ? message:"";
			WSU.OPC.Checkout.createLoader(parentBlock, message);
			$(jObj+' .opc-ajax-loader .loader .message').html(html);
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
			$('#co-payment-form input[type="radio"]:checked').closest('dt').addClass('active');
			WSU.OPC.Shipping.init();
			WSU.OPC.Billing.init();	
			WSU.OPC.initMessages();
			WSU.OPC.initSaveOrder();
			
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
			$('#co-payment-form input[type="radio"]:checked').closest('dt').addClass('active');
			$('#p_method_'+method).parent().addClass('active');
		}
	};
})(jQuery,jQuery.WSU||{});