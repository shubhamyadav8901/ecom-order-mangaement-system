package com.ecommerce.order.event;

import java.io.Serializable;

public class OrderCancelledEvent implements Serializable {
    private Long orderId;

    public OrderCancelledEvent() {}

    public OrderCancelledEvent(Long orderId) {
        this.orderId = orderId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
}
