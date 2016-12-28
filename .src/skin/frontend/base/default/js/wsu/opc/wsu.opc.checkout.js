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


            if(window.click_to_save){
                if($("#payment_click_to_save").length<=0){
                    $("#co-payment-form").prepend("<a id='payment_click_to_save' class='to_save'></a>");
                    WSU.OPC.Decorator.disableSaveBtn("payment");
                }
            }



            if (this.config.isLoggedIn===1){
                var addressId = $('#billing-address-select').val();
                if ( WSU.OPC.defined(addressId) && "" !== addressId ){
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
            //this.updateShippingMethods();
        },

        /** PARSE RESPONSE FROM AJAX SAVE BILLING AND SHIPPING METHOD **/
        prepareAddressResponse: function(response){
            console.log(response);
            WSU.OPC.Decorator.hideLoader("#opc-address-form-billing");
            WSU.OPC.Decorator.hideLoader("#opc-address-form-shipping");
            WSU.OPC.Decorator.hideLoader("#opc-co-shipping-method-form");
            //WSU.OPC.Checkout.xhr = null;

            if (WSU.OPC.defined(response.error)){
                var height = (response.message.length/35)*29 + 25;
                WSU.OPC.popup_message(response.message,{width: 350, height: height});
                WSU.OPC.Checkout.unlockPlaceOrder();
                return;
            }
            if (WSU.OPC.defined(response.worked_on)){
                WSU.OPC.Decorator.setSaveBtnSaved(response.worked_on);
            }

            if(WSU.OPC.defined(response.exists) && true === response.exists){
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
            if (WSU.OPC.defined(response.address_validation)){
                $("#checkout-address-validation-load").empty().html(response.address_validation);
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.Checkout.unlockPlaceOrder();
                return;
            }

            if (WSU.OPC.defined(response.shipping)){
                $("#opc-co-shipping-method-form").empty().html(response.shipping);
                if(window.click_to_save){
                    if($("#shipping_click_to_save").length<=0){
                        $(".shipping-block").prepend("<a id='shipping_click_to_save' class='to_save'></a>");
                    }
                    WSU.OPC.Decorator.setSaveBtnAction("shipping",function(){
                        WSU.OPC.Shipping.save();
                    });
                    WSU.OPC.Decorator.disableSaveBtn("shipping");
                }
            }

            if (WSU.OPC.defined(response.payments)){
                $("#checkout-payment-method-load").empty().html(response.payments);

                WSU.OPC.removeNotAllowedPaymentMethods();
                payment.initWhatIsCvvListeners();//default logic for view "what is this?"
            }
            console.log(response.isVirtual);
            if (WSU.OPC.defined(response.isVirtual) && false !== response.isVirtual){
                WSU.OPC.Checkout.isVirtual = true;
            }

            if(window.click_to_save){
                WSU.OPC.Decorator.disableSaveBtn("billing");
            }

            if (false === WSU.OPC.Checkout.isVirtual){

                var update_payments = false;
                if ( WSU.OPC.defined(response.reload_payments) ){
                    update_payments = true;
                }

                var reload_totals = false;
                if ( WSU.OPC.defined(response.reload_totals) ){
                    reload_totals = true;
                }

                WSU.OPC.Shipping.saveShippingMethod(update_payments, reload_totals);
            }else{
                $('.shipping-block').hide();
                $('.payment-block').addClass('clear-margin');
                WSU.OPC.Checkout.pullPayments();
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


        /** APPLY SHIPPING METHOD FORM TO BILLING FORM **/
        applyShippingMethod: function(form){
            var formShippimgMethods = $('#opc-co-shipping-method-form').serializeArray();
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
                    WSU.OPC.Checkout.unlockPlaceOrder();
                    if ( WSU.OPC.defined(response.review) ){
                        WSU.OPC.Decorator.updateGrandTotal(response);
                        $('#opc-review-block').html(response.review);

                        WSU.OPC.Checkout.removePrice();
                        //WSU.OPC.recheckAgree();
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
                    WSU.OPC.Decorator.hideLoader();
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
            WSU.OPC.Decorator.showLoader("#co-payment-form","<h1>Getting payment choices</h1>");

            WSU.OPC.ajaxManager.addReq("savePayments",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/payments',
                dataType: 'json',
                success:function(response){
                    /*WSU.OPC.Decorator.hideLoader('.payment-block');
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


                    WSU.OPC.Decorator.hideLoader("#co-payment-form");
                    if ( WSU.OPC.defined(response.error) ){
                        WSU.OPC.popup_message(response.error);
                        WSU.OPC.saveOrderStatus = false;
                        WSU.OPC.Decorator.hideLoader();
                        WSU.OPC.Checkout.unlockPlaceOrder();
                        return;
                    }
                    if (WSU.OPC.defined(response.worked_on)){
                        if("payments"===response.worked_on){
                            WSU.OPC.Decorator.setSaveBtnSaved("payment");
                        }
                    }
                    if ( WSU.OPC.defined(response.payments) ){
                        $('#checkout-payment-method-load').html(response.payments);
                        payment.initWhatIsCvvListeners();
                        WSU.OPC.bindChangePaymentFields();
                        WSU.OPC.Decorator.setCurrentPaymentActive();
                    }

                    WSU.OPC.Checkout.pullReview();
                    /*if( WSU.OPC.defined(callback) && $.isFunction(callback)){
                        callback();
                    }*/
                }
            });

        },

        lockPlaceOrder: function(mode){
            if( ! WSU.OPC.defined(mode) || false === mode){
                mode = 0;
            }
            if(0 === mode){
                $('.opc-btn-checkout').addClass('button-disabled');
            }
            WSU.OPC.Checkout.disabledSave = true;
        },

        unlockPlaceOrder: function(){
            $('.opc-btn-checkout').removeClass('button-disabled');
            WSU.OPC.Checkout.disabledSave = false;
        },

        abortAjax: function(){
            if (null !== WSU.OPC.Checkout.xhr){
                WSU.OPC.Checkout.xhr.abort();

                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.Decorator.hideLoader();
                WSU.OPC.Checkout.unlockPlaceOrder();
            }
        },

        reloadShippingsPayments: function(form_type, delay){
            WSU.OPC.Decorator.showLoader('#co-payment-form',"<h1>Getting payment choices</h1>");
            WSU.OPC.ajaxManager.addReq("savePayments",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/reloadShippingsPayments',
                dataType: 'json',
                success: WSU.OPC.Checkout.reloadShippingsPaymentsResponse
            });
        },

        reloadShippingsPaymentsResponse: function(response){

            WSU.OPC.Checkout.xhr2 = null;

            if ( WSU.OPC.defined(response.error) ){
                $('.opc-message-container').html(response.message);
                $('.opc-message-wrapper').show();
                WSU.OPC.Decorator.hideLoader('#co-payment-form');
                WSU.OPC.Checkout.unlockPlaceOrder();
                return;
            }

            if ( WSU.OPC.defined(response.shipping) ){
                $('#opc-co-shipping-method-form').empty().html(response.shipping);
            }
            if (WSU.OPC.defined(response.worked_on)){
                WSU.OPC.Decorator.hideLoader("#co-payment-form");
                if("shipping_payments"===response.worked_on){
                    WSU.OPC.Decorator.setSaveBtnSaved("payment");
                }
            }
            if ( WSU.OPC.defined(response.payments) ){

                if("" !== response.payments){
                    $('#checkout-payment-method-load').empty().html(response.payments);

                    WSU.OPC.removeNotAllowedPaymentMethods();
                    payment.initWhatIsCvvListeners();//default logic for view "what is this?"
                }
                if (WSU.OPC.defined(response.worked_on)){
                    if("shipping_payments"===response.worked_on){
                        WSU.OPC.Decorator.setSaveBtnSaved("payment");
                    }
                }

                if (false === WSU.OPC.Checkout.isVirtual){
                    var update_payments = false;
                    if ( WSU.OPC.defined(response.reload_payments) ){
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
                if( WSU.OPC.defined(response.reload_totals) ){
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
            WSU.OPC.Checkout.xhr = null;
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
