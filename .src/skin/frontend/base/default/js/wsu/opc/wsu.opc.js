jQuery.WSU=jQuery.WSU||{};
(function($,WSU){
    //for PO boxes
    Validation.add('validate-pobox','We cannot ship to your P.O. Please check the button to ship to a different address.',function(field_value) {
        // setup a regex var for pretty much every possibility of PO box...
        var regex = /[P|p]*(OST|ost)*\.*\s*[O|o|0]*(ffice|FFICE)*\.*\s*[B|b][O|o|0][X|x]/gi;
        // if the field_value contains PO Box

        if(field_value.match(regex)) {
            /*if (document.getElementById('billing:use_for_shipping_yes').checked === true) {
                return false;
                //return false;
            }*/
            return false;
        } else if(!field_value.match(regex)) {
            return true;
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
                $("#real_dis_code").val("");
                $("#discount-coupon-form-inline input[type='text']").val("");
                $("#alumni_discount-coupon-form input[type='text']").val("");
            });
        }
    });

    //Billing =  Class.create();
    //Shipping =  Class.create();
    WSU.OPC = {
        agreements : null,
        saveOrderStatus:false,
        is_subscribe:false,

//too old??
        savingOrder:false,
        form_order:['billing','shipping','shipping_method','discounts','payment_method','reviewed'],
        form_status:{
            billing:{ready:false, saved:false},
            shipping:{ready:false, saved:false, skipping: true},
            shipping_method:{ready:false, saved:false},
            payment_method:{ready:false, saved:false},
            discounts:{ready:false, saved:false},
            reviewed:{ready:false, saved:false},
        },

        defined : function(item){
            return "undefined" !== item && undefined !== item;
        },

        initMessages: function(){
            $('.close-message-wrapper, .opc-messages-action .button').on('click',function(e){
                e.preventDefault();
                $('.opc-message-wrapper').hide();
                $('.opc-message-container').empty();
            });
        },

        popup_message: function(html_message,sizeObj){
            if( WSU.OPC.defined(html_message) ){

                if($("#mess").length<=0){
                    $('body').append('<div id="mess">');
                }
                if($.isArray(html_message)){
                    html_message = html_message.join("_");
                }
                $("#mess").html((typeof html_message === 'string' || html_message instanceof String) ? html_message:html_message.html() );

                sizeObj = sizeObj || {width: 350,minHeight: 25, height:function(){
                    return ($("#mess").text().length / 45)* 25;
                }};

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
                };
                defaultParams = jQuery.extend(defaultParams,sizeObj);
                $( "#mess" ).dialog(defaultParams);
            }
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
                    clearTimeout( this.tid );
                }
            };
        }()),


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
                if(WSU.OPC.is_subscribe) {
                    $('#is_subscribed').prop('checked', true);
                } else {
                    $('#is_subscribed').prop('checked', false);
               }
            }

            // check agree
            WSU.OPC.recheckAgree();
        },

        recheckAgree: function(){
            if(WSU.OPC.agreements !== null){
                $.each(WSU.OPC.agreements, function(index, data){
                    $('#checkout-agreements input').each(function(){
                        if(data.name === $(this).prop('name')){
                            $(this).prop('checked', true);
                        }
                    });
                });
            }
        },


        /** VALIDATE ADDRESS BEFORE SEND TO SAVE QUOTE**/
        validateAddressForm: function(form){
            var has_empty = false; // check all required fields not empty
            var has_value = false; // check all required fields not empty
            $('#opc-address-form-'+form+' .validation-passed').removeClass("validation-passed"); //force the validation path
            $('#opc-address-form-'+form+' .required-entry').each(function(){
                if($(this).val() === '' && $(this).css('display') !== 'none' && !$(this).attr('disabled')){
                    has_empty = true;
                }else{
                    has_value = true;
                }
            });
            //if shipping is through billing make sure form is clear and return true
            if( "shipping" === form && WSU.OPC.form_status.shipping.skipping ){
                if(has_value){
                    this.clearAddressForm("shipping");
                }
                console.log("just validated " + form + " and it passed");
                return true;
            }




            if(has_empty){
                console.log("tried to validated " + form + " but was empty");
                return false;
            }

            var addressForm = new Validation('opc-address-form-'+form, { onSubmit : false, stopOnFirst : false, focusOnError : false});
            if (addressForm.validate()){
                console.log("just validated " + form + " and it passed");
                return true;
            }else{
                console.log("just validated " + form + " and it passed");
                return false;
            }
        },
        clearAddressForm: function(form){
            console.log("clearing the "+form+" address form  --");
            $("#opc-address-form-"+form+" input[type='text']").val("");
            $("#opc-address-form-"+form+" :checked").attr("checked",false);
            $("#opc-address-form-"+form+" :selected").attr("selected",false);

            //we will do it fourcfull to cover all browser by repeating
            //function with different selector patterns.  Again just in case
            $('#opc-address-form-'+form+' :input').each(function(){
                if( $(this).is("select") ){
                    $(this).find(":selected").removeAttr("selected");
                } else if( "checkbox" === $(this).attr("type") ){
                    $(this).removeAttr("checked");
                } else {
                    $(this).val("");
                }
            });
        },

        is_dirty: function (form){
            var formdata = $("#opc-address-form-"+form).serialize();
            if( formdata === WSU.OPC[form]._data ){
                return false;
            }else{
                WSU.OPC[form]._data = formdata;
                WSU.OPC.form_status[form].ready = false;
                WSU.OPC.form_status[form].saved = false;
                return true;
            }
        },

        is_address_forms_ready: function(){
            return WSU.OPC.form_status.billing.ready && WSU.OPC.form_status.billing.saved && WSU.OPC.form_status.shipping.ready && WSU.OPC.form_status.shipping.saved;
        },
/** CREATE EVENT FOR UPDATE SHIPPING BLOCK **/
        initChangeAddress: function(form){
            $('#opc-address-form-'+form+' :input').on("change keyup blur",function(){
                if( WSU.OPC.is_dirty(form) ){
                    console.log("#opc-address-form-"+form+" :input/select change is drity");
                   // WSU.OPC.Checkout.abortAjax();
                    WSU.OPC[form].validateForm(300,function(){
                        if( WSU.OPC.form_status[form].ready ){
                            console.log(form+" is drity but valid");
                            WSU.OPC.shipping_method.reloadHtml(form);
                        }else{
                            console.log(form+" is drity and NOT valid");
                        }
                    });
                }
            });
        },
        displayShippingMethodAccurrecy: function(){//caller){
            if( ( WSU.OPC.form_status.billing.ready && !WSU.OPC.form_status.billing.saved ) || ( WSU.OPC.form_status.shipping.ready && !WSU.OPC.form_status.shipping.saved ) )
            {
                WSU.OPC.Decorator.setSaveBtnDoing("shipping_method","Updating Options");
            }
        },
        minFieldsRateLookup: function(form){
            var zip = $('#'+form+':postcode').val();
            var country = $('#'+form+':country_id').val();
            var region = $('#'+form+':region_id').val();

            if(zip !== '' || country !== '' || region !== ''){
                return true;
            } else {
                return false;
            }
        },




    };
})(jQuery,jQuery.WSU);
