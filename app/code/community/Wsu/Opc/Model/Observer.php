<?php
class Wsu_Opc_Model_Observer
{

    public function setCheckoutType()//$observer)
    {
        if (Mage::getStoreConfig('wsu_opc/global/status')) {
            if (false !== strpos(Mage::helper('core/url')->getCurrentUrl(), '/checkout/')) {
                Mage::app()->getResponse()->setRedirect(Mage::getUrl("onepage"));
            }
        }
    }
    public function applyComment($observer)
    {
        $order = $observer->getData('order');

        $comment = Mage::getSingleton('core/session')->getOpcOrderComment();
        if (!Mage::helper('wsu_opc')->isShowComment() || empty($comment)) {
            return;
        }
        try {
            $order->setCustomerComment($comment);
            $order->setCustomerNoteNotify(true);
            $order->setCustomerNote($comment);
            $order->addStatusHistoryComment($comment)->setIsVisibleOnFront(true)->setIsCustomerNotified(true);
            $order->save();
            $order->sendOrderUpdateEmail(true, $comment);
        } catch (Exception $e) {
            Mage::logException($e);
        }
    }
    public function newsletter($observer)
    {
        $_session = Mage::getSingleton('core/session');

        $newsletterFlag = $_session->getIsSubscribed();
        if ($newsletterFlag==true) {
            $email = $observer->getEvent()->getOrder()->getCustomerEmail();

            $subscriber = Mage::getModel('newsletter/subscriber')->loadByEmail($email);
            if ($subscriber->getStatus() != Mage_Newsletter_Model_Subscriber::STATUS_SUBSCRIBED && $subscriber->getStatus() != Mage_Newsletter_Model_Subscriber::STATUS_UNSUBSCRIBED) {
                $subscriber->setImportMode(true)->subscribe($email);

                $subscriber = Mage::getModel('newsletter/subscriber')->loadByEmail($email);
                $subscriber->sendConfirmationSuccessEmail();
            }

        }

    }
}
