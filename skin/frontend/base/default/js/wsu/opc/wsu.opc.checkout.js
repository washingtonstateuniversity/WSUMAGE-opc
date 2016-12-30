(function($,WSU){
    WSU.OPC.Checkout = {
        config:null,
        ajaxProgress:false,
        xhr: null,
        isVirtual: false,
        disabledSave: false,
        saveOrderUrl: null,
        updateShippingPaymentProgress: false,

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
            WSU.OPC.shipping.init();
            WSU.OPC.billing.init();
            WSU.OPC.initMessages();
            WSU.OPC.order.init();


            if( window.click_to_save && $("#payment_click_to_save").length <= 0 ){
                $("#co-payment-form").prepend("<a id='payment_click_to_save' data-action='' class='to_save'></a>");
                WSU.OPC.Decorator.disableSaveBtn("payment");
            }
            var tar = $('input[name="billing[use_for_shipping]"]');
            //var current_val = tar.val();
            if ( tar.is(':checked') ){
                WSU.OPC.form_status.shipping.skipping = true;
            }else{
                WSU.OPC.form_status.shipping.skipping = false;
            }

            WSU.OPC.shipping_method.cache();

            /*if ( 1 === this.config.isLoggedIn ){
                var addressId = $('#billing-address-select').val();
                if ( WSU.OPC.defined(addressId) && "" !== addressId ){
                    WSU.OPC.billing.save();
                }else{
                    WSU.OPC.payment.reloadHtml();//FIX FOR MAGENTO 1.8 - NEED LOAD PAYTMENT METHOD BY AJAX
                }
            }else{
                //FIX FOR MAGENTO 1.8 - NEED LOAD PAYTMENT METHOD BY AJAX
                WSU.OPC.payment.reloadHtml();
            }*/ // skipping 1.8 back compat
            if ( 1 === this.config.isLoggedIn ){
                var addressId = $('#billing-address-select').val();
                if ( WSU.OPC.defined(addressId) && "" !== addressId ){
                    WSU.OPC.billing.save();
                }
            }

            WSU.OPC.payment.init();
            //this.updateShippingMethods();
        },

        /*checkout_order:["billing","shipping","shipping_method","coupon","payment","order"], // the big block save order
        run_to_checkout: function(caller){
            $.each(this.checkout_order, function(idx, form){
                if( false === WSU.OPC.form_status[form].saved ){
                    WSU.OPC[form].validateForm();
                }
            });
        },*/



        /** PARSE RESPONSE FROM AJAX SAVE BILLING AND SHIPPING ADDRESS FORMS **/
        prepareAddressResponse: function(response,mode){
            console.log( "prepareAddressResponse", response );

            WSU.OPC.Decorator.hideLoader("#opc-address-form-billing");
            WSU.OPC.Decorator.hideLoader("#opc-address-form-shipping");
            WSU.OPC.Decorator.hideLoader("#opc-co-shipping-method-form");

            if (WSU.OPC.defined(response.error)){
                var height = ((response.message.length / 35) * 29) + 25;
                WSU.OPC.popup_message( response.message, {width: 350, height: height} );
                WSU.OPC.order.unlock();
                return;
            }

            WSU.OPC.Decorator.setSaveBtnSaved(mode);

            if( WSU.OPC.defined(response.exists) && true === response.exists ){
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
            if ( WSU.OPC.defined(response.address_validation) ){
                $("#checkout-address-validation-load").empty().html(response.address_validation);
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();
                return;
            }

            if ( WSU.OPC.defined(response.shipping_methods) ){
                $("#opc-co-shipping-method-form").empty().html(response.shipping_methods);
                WSU.OPC.Decorator.setSaveBtnSaved("shipping_method");
                WSU.OPC.shipping_method.init_change();
            }

            if (WSU.OPC.defined(response.payments)){
                $("#checkout-payment-method-load").empty().html(response.payments);
                WSU.OPC.payment.filterMethods();
                WSU.OPC.Decorator.setSaveBtnSaved("payment");
                //payment.initWhatIsCvvListeners();//default logic for view "what is this?"
            }


            if (WSU.OPC.defined(response.isVirtual) && false !== response.isVirtual){
                WSU.OPC.Checkout.isVirtual = true;
            }

            /*if(window.click_to_save){
                WSU.OPC.Decorator.setSaveBtnSaved("billing");
            }*/

            if (false === WSU.OPC.Checkout.isVirtual){
                if( WSU.OPC.is_address_forms_ready() ){
                    WSU.OPC.shipping_method.reloadHtml();
                }

                var update_payments = false;
                if ( WSU.OPC.defined(response.reload_payments) ){
                    update_payments = true;
                }

                var reload_totals = false;
                if ( WSU.OPC.defined(response.reload_totals) ){
                    reload_totals = true;
                }

                WSU.OPC.shipping_method.save(update_payments, reload_totals);
            }else{
                $('.shipping-block').hide();
                $('.payment-block').addClass('clear-margin');
                WSU.OPC.payment.reloadHtml();
            }
        },

        clearOnChange: function(){
            $('.opc-wrapper-opc :input').removeAttr('onclick').removeAttr('onchange');
        },

        removePrice: function(){
            $('.opc-data-table tr th:nth-child(2)').remove();
            $('.opc-data-table tbody tr td:nth-child(2)').remove();
            $('.opc-data-table tfoot td').each(function(){
                var colspan = $(this).attr('colspan');

                if ( WSU.OPC.defined(colspan) && "" !== colspan ){
                    colspan = parseInt(colspan) - 1;
                    $(this).attr('colspan', colspan);
                }
            });

            $('.opc-data-table tfoot th').each(function(){
                var colspan = $(this).attr('colspan');

                if ( WSU.OPC.defined(colspan) && "" !== colspan ){
                    colspan = parseInt(colspan) - 1;
                    $(this).attr('colspan', colspan);
                }
            });

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
            WSU.OPC.Decorator.showLoader('#review-block',"<h1>Recalulating</h1>");


            WSU.OPC.ajaxManager.addReq("saveReview",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/review',
                dataType: 'json',
                success:function(response){
                    WSU.OPC.Decorator.hideLoader('.review-block');
                    if ( WSU.OPC.defined(response.review) ){
                        $('#review-block').html(response.review);
                        WSU.OPC.Checkout.removePrice();
                    }
                    if($( "tr:contains('Free Shipping - Free')" ).length){
                        $( "tr:contains('Free Shipping - Free')" ).hide();
                    }
                    WSU.OPC.order.unlock();
                    if ( WSU.OPC.defined(response.review) ){
                        WSU.OPC.Decorator.updateGrandTotal(response);
                        $('#opc-review-block').html(response.review);

                        WSU.OPC.Checkout.removePrice();
                        //WSU.OPC.recheckAgree();
                    }
                    WSU.OPC.payment.filterMethods();
                }
            });
        },

        /*abortAjax: function(){
            clearTimeout(WSU.OPC.Checkout.ajaxProgress);
            if (null !== WSU.OPC.Checkout.xhr){
                WSU.OPC.Checkout.xhr.abort();
                WSU.OPC.Checkout.xhr = null;
                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();
            }
        },*/

        setUpShippingBillingSwitcher: function(){
            $("#btn_use_for_shipping_yes").on("click",function(e){
                e.preventDefault();
                e.stopPropagation();
                var tar = $('input[name="billing[use_for_shipping]"]');
                //var current_val = tar.val();
                if ( ! tar.is(':checked') ){
                    $('[name="billing[use_for_shipping]"]').trigger("click");
                    $('input[name="billing[use_for_shipping]"]').prop('checked', true);
                    $('input[name="shipping[same_as_billing]"]').prop('checked', true);
                    WSU.OPC.form_status.shipping.skipping = true;
                }else{
                    $('[name="billing[use_for_shipping]"]').trigger("click");
                    $('input[name="billing[use_for_shipping]"]').prop('checked', false);
                    $('input[name="shipping[same_as_billing]"]').prop('checked', false);
                    WSU.OPC.form_status.shipping.skipping = false;
                    WSU.OPC.shipping.init_change();
                }

                console.log("switching use_for_shipping status");
                if ( tar.is(':checked') ){
                    console.log("using billing for shipping");

                    $("#and_shipping").show();
                    WSU.OPC.billing.setBillingForShipping(true);
                    $('#opc-address-form-billing select[name="billing[country_id]"]').change();

                    if( $("#checkout-shipping-method-load .using_shipping_address").length ){
                        if( WSU.OPC.billing.form_valid ){
                            $("#checkout-shipping-method-load").html("<p>Working on a new shipping quote</p>");
                        }
                        $("#checkout-shipping-method-load .using_shipping_address").removeClass("using_shipping_address");
                    }

                    // clear shipping just in case
                    WSU.OPC.clearAddressForm("shipping");
                    WSU.OPC.form_status.shipping.ready = true;
                    WSU.OPC.form_status.shipping.saved = true;

                    WSU.OPC.billing.validateForm();
                }else{
                    console.log("new shipping");
                    $("#checkout-shipping-method-load").html("<p>Update Shipping information for new quote</p>");
                    $("#checkout-shipping-method-load").addClass("using_shipping_address");

                    //WSU.OPC.billing.pushBilingToShipping();
                    WSU.OPC.billing.setBillingForShipping(false);

                    $("#and_shipping").hide();
                    WSU.OPC.initChangeAddress('shipping');

                    WSU.OPC.form_status.shipping.ready = false;
                    WSU.OPC.form_status.shipping.saved = false;

                    WSU.OPC.shipping.validateForm();
                }
            });
        },
    };

    WSU.OPC.order = {
        init: function(){
             WSU.OPC.order.init_change();
        },

        lock: function(mode){
            if( ! WSU.OPC.defined(mode) || false === mode){
                mode = 0;
            }
            if(0 === mode){
                $('.opc-btn-checkout').addClass('button-disabled');
            }
            WSU.OPC.Checkout.disabledSave = true;
        },

        unlock: function(){
            $('.opc-btn-checkout').removeClass('button-disabled');
            WSU.OPC.Checkout.disabledSave = false;
        },


        /** CREATE EVENT FOR SAVE ORDER **/
        init_change: function(){
            $(".opc-btn-checkout").on("click", function(e){
                e.preventDefault();
                if ( true === WSU.OPC.Checkout.disabledSave ){
                    return;
                }

                // check agreements
                var mis_aggree = false;
                $("#checkout-agreements input[name*='agreement']").each(function(){
                    if(!$(this).is(':checked')){
                        mis_aggree = true;
                    }
                });

                if(mis_aggree){
                    $('.opc-message-container').html($('#agree_error').html());
                    $('.opc-message-wrapper').show();
                    WSU.OPC.Decorator.hideLoader();
                    WSU.OPC.order.unlock();
                    WSU.OPC.saveOrderStatus = false;
                    return false;
                }

                // would be a loop and check
                var billing_addressForm = new VarienForm("opc-address-form-billing");
                if ( !billing_addressForm.validator.validate() ){
                    return;
                }

                if ( !$('input[name="billing[use_for_shipping]"]').prop('checked') ){
                    var shipping_addressForm = new VarienForm('opc-address-form-shipping');
                    if ( !shipping_addressForm.validator.validate() ){
                        return;
                    }
                }
                //EOD loop and check


                WSU.OPC.saveOrderStatus = true;
                WSU.OPC.Plugin.dispatch('saveOrderBefore');
                if (WSU.OPC.Checkout.isVirtual===false){
                    WSU.OPC.order.lock();
                    WSU.OPC.shipping_method.save();
                    //WSU.OPC.Checkout.run_to_checkout("shipping_method");
                }else{
                    WSU.OPC.payment.validateForm();
                }
            });

        },

        /** SAVE ORDER **/
        save: function(){

            var promises = [];
            $.each(WSU.OPC.form_order, function(index, val) {
                promises.push(function(){
                    console.log("promises "+val);
                    WSU.OPC[val].save();
                });
            });
            $.when.apply($, promises).then(function() {
                console.log("done with promises ");
                var form = $('#co-payment-form').serializeArray();
                form  = WSU.OPC.checkAgreement(form);
                form  = WSU.OPC.checkSubscribe(form);
                form  = WSU.OPC.Comment.getComment(form);

                WSU.OPC.Decorator.showLoader("#general_message","<h1>Processing order.</h1>");
                WSU.OPC.order.lock();

                if (WSU.OPC.Checkout.config.comment!=="0"){
                    WSU.OPC.Comment.saveCustomerComment();
                    setTimeout(function(){
                        WSU.OPC.order.saveProxy(form);
                    },600);
                }else{
                    WSU.OPC.order.saveProxy(form);
                }
            });

        },
        saveProxy: function(form){
            WSU.OPC.Plugin.dispatch('saveOrder');
            WSU.OPC.savingOrder=true;
            WSU.OPC.ajaxManager.addReq("saveOrder",{
                type: 'POST',
                url: WSU.OPC.Checkout.saveOrderUrl,
                dataType: 'json',
                data: form,
                success: WSU.OPC.order.saveResponse
            });
        },
        saveResponse: function(response){
            //WSU.OPC.Checkout.abortAjax();
            if ( WSU.OPC.defined(response.error) && response.error!==false){
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();

                WSU.OPC.saveOrderStatus = false;
                $('.opc-message-container').html(response.error);
                $('.opc-message-wrapper').show();
                WSU.OPC.Plugin.dispatch('error');
                return;
            }

            if ( WSU.OPC.defined(response.error_messages) && response.error_messages!==false){
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();

                WSU.OPC.saveOrderStatus = false;
                $('.opc-message-container').html(response.error_messages);
                $('.opc-message-wrapper').show();
                WSU.OPC.Plugin.dispatch('error');
                return;
            }

            if ( WSU.OPC.defined(response.redirect) ){
                if (response.redirect!==false){
                    setLocation(response.redirect);
                    return;
                }
            }

            WSU.OPC.Plugin.dispatch('responseSaveOrder', response);
        },

    };

    WSU.OPC.payment = {
        init: function(){
            $('.signature-block h3').on('click', function(){
                if ($(this).hasClass('open-block')){
                    $(this).removeClass('open-block');
                    $(this).next().addClass('hidden');
                }else{
                    $(this).addClass('open-block');
                    $(this).next().removeClass('hidden');
                }
            });
            WSU.OPC.payment.filterMethods();
            WSU.OPC.payment.init_change();

            $('#co-payment-form input[type="radio"]').on('click', function(){
                WSU.OPC.payment.filterMethods();
                WSU.OPC.payment.validateForm();
            });
        },

        /** BIND CHANGE PAYMENT FIELDS **/
        init_change: function(){
            $('#co-payment-form :input').off().on('keyup change blur',function(e){
                e.preventDefault();
                clearTimeout(WSU.OPC.Checkout.formChanging);
                WSU.OPC.Checkout.formChanging = setTimeout(function(){
                    if ( false !== WSU.OPC.Checkout.ajaxProgress ){
                        clearTimeout(WSU.OPC.Checkout.ajaxProgress);
                    }
                    WSU.OPC.Checkout.ajaxProgress = setTimeout(function(){
                        WSU.OPC.payment.validateForm();
                    }, 1000);
                }, 500);
            });
        },

        /** PULL PAYMENTS METHOD AFTER LOAD PAGE **/
        reloadHtml: function(){
            WSU.OPC.order.lock();
            WSU.OPC.Decorator.showLoader("#co-payment-form","<h1>Refreshing</h1>");

            WSU.OPC.ajaxManager.addReq("savePayments",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/payments',
                dataType: 'json',
                success: WSU.OPC.payment.reloadHtmlResponse
            });
        },
        reloadHtmlResponse: function(response){
            WSU.OPC.Decorator.hideLoader("#co-payment-form");
            if ( WSU.OPC.defined(response.error) ){
                WSU.OPC.popup_message(response.error);
                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();
                return;
            }
            if (WSU.OPC.defined(response.worked_on)){
                if("payments"===response.worked_on){
                    WSU.OPC.Decorator.setSaveBtnSaved("payment");
                }
            }
            if ( WSU.OPC.defined(response.payments) ){
                $('#checkout-payment-method-load').html(response.payments);
                //payment.initWhatIsCvvListeners();
                WSU.OPC.payment.init_change();
                WSU.OPC.Decorator.setCurrentPaymentActive();
            }

            WSU.OPC.Checkout.pullReview();
            /*if( WSU.OPC.defined(callback) && $.isFunction(callback)){
                callback();
            }*/
        },

        /** remove not allowed payment method **/
        filterMethods: function(){
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
        validateForm: function(){
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
                    WSU.OPC.Decorator.hideLoader();
                    WSU.OPC.order.unlock();
                    return false;
                }
            }

            /*var vp = payment.validate();
            if(!vp){
                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();
                return false;
            }*/ // issue here is that we basiccally do the same thing next so kill for now

            var paymentMethodForm = new Validation('co-payment-form', { onSubmit : false, stopOnFirst : false, focusOnError : false});

            if (paymentMethodForm.validate()){
                WSU.OPC.payment.save();
            }else{
                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();

                WSU.OPC.payment.init_change();
            }


        },


        /** SAVE PAYMENT **/
        save: function(){
            //WSU.OPC.Checkout.abortAjax();

            WSU.OPC.order.lock();

            var form = $('#co-payment-form').serializeArray();
            WSU.OPC.Decorator.showLoader("#co-payment-form","<h1>Saving</h1>");
            WSU.OPC.ajaxManager.addReq("savePayment",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/savePayment',
                dataType: 'json',
                data: form,
                success: WSU.OPC.payment.saveResponse
            });

        },

        /** CHECK RESPONSE FROM AJAX AFTER SAVE PAYMENT METHOD **/
        saveResponse: function(response){
            WSU.OPC.Decorator.hideLoader("#co-payment-form");
            //WSU.OPC.Checkout.abortAjax();

            WSU.OPC.agreements = $('#checkout-agreements').serializeArray();
            if ( WSU.OPC.defined(response.review) && false === WSU.OPC.saveOrderStatus ){
                $('#review-block').html(response.review);
                if($( "tr:contains('Free Shipping - Free')" ).length){
                    $( "tr:contains('Free Shipping - Free')" ).hide();
                }
                WSU.OPC.Checkout.removePrice();
            }
            WSU.OPC.getSubscribe();

            if ( WSU.OPC.defined(response.review) ){
                WSU.OPC.Decorator.updateGrandTotal(response);
                $('#opc-review-block').html(response.review);
                WSU.OPC.Checkout.removePrice();

                // need to recheck subscribe and agreement checkboxes
                WSU.OPC.recheckItems();
            }

            if ( WSU.OPC.defined(response.error) ){
                WSU.OPC.Plugin.dispatch('error');
                WSU.OPC.popup_message(response.error);
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.order.unlock();
                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.ready_payment_method=false;
                return;
            }
            if (WSU.OPC.defined(response.worked_on)){
                if("payments"===response.worked_on){
                    WSU.OPC.Decorator.setSaveBtnSaved("payment");
                }
            }
            //SOME PAYMENT METHOD REDIRECT CUSTOMER TO PAYMENT GATEWAY
            WSU.OPC.ready_payment_method=true;
            if ( WSU.OPC.defined(response.redirect) && WSU.OPC.saveOrderStatus===true){
                //WSU.OPC.Checkout.abortAjax();
                WSU.OPC.Plugin.dispatch('redirectPayment', response.redirect);
                if (WSU.OPC.Checkout.xhr==null){
                    setLocation(response.redirect);
                } else {
                    WSU.OPC.Decorator.hideLoader("#co-payment-form");
                    WSU.OPC.order.unlock();
                }
                return;
            }

            if (WSU.OPC.saveOrderStatus===true){
                WSU.OPC.order.save();
            } else {
                WSU.OPC.Decorator.hideLoader("#co-payment-form");
                WSU.OPC.order.unlock();
            }

            WSU.OPC.Plugin.dispatch('savePaymentAfter');
        },

    };




    WSU.OPC.SignatureAtCheckout = {
        init: function(){
            $('.signature-block h3').on('click', function(){
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

            $('.view-agreement').on('click', function(e){
                e.preventDefault();
                $('.opc-review-actions #modal-agreement').addClass('md-show');

                var id = $(this).data('id');
                var title = $(this).html();
                var content = $('.opc-review-actions #agreement-block-'+id).html();

                $('.opc-review-actions #agreement-title').html(title);
                $('.opc-review-actions #agreement-modal-body').html(content);
            });

            $('#checkout-agreements input[name*="agreement"]').on('click', function(){
                var cur_ele = $(this);
                $('#checkout-agreements input').each(function(){
                    if(cur_ele.prop('name') === $(this).prop('name')){
                        $(this).prop('checked', cur_ele.prop('checked'));
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
                //todo account for SSO via social accounts
                e.preventDefault();
                $('#modal-login').addClass('md-show');
            });

            $('.md-modal .close').on('click',function(e){
                e.preventDefault();
                $('.md-modal').removeClass('md-show');
            });

            $('.restore-account').on('click', function(e){
                e.preventDefault();
                $('#login-form').hide();
                $('#login-button-set').hide();
                $('#form-validate-email').fadeIn();
                $('#forgotpassword-button-set').show();
            });


            $('#login-button-set .btn').on('click',function(e){
                e.preventDefault();
                $('#login-form').submit();
            });

            $('#forgotpassword-button-set .btn').on('click',function(e){
                e.preventDefault();
                var form = $('#form-validate-email').serializeArray();
                WSU.OPC.Decorator.showLoader();
                WSU.OPC.Checkout.xhr = $.post(WSU.OPC.Checkout.config.baseUrl + 'onepage/json/forgotpassword',form, WSU.OPC.Login.prepareResponse,'json');
            });


            $('#forgotpassword-button-set .back-link').on('click',function(e){
                e.preventDefault();
                $('#form-validate-email').hide();$('#forgotpassword-button-set').hide();
                $('#login-form').fadeIn();$('#login-button-set').show();
            });

        },

        prepareResponse: function(response){
            //WSU.OPC.Checkout.abortAjax();
            WSU.OPC.Decorator.hideLoader();
            if ( WSU.OPC.defined(response.error) ){
                alert(response.message); //todo move to modal
            }else{
                alert(response.message);
                $('#forgotpassword-button-set .back-link').click();
            }
        }
    };


})(jQuery,jQuery.WSU||{});
